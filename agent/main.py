import os
import sys

# Налаштовуємо UTF-8 кодування для виведення на консоль у Windows
if sys.platform.startswith('win'):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import json
import argparse
import requests
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

# Змінна для зберігання останнього HTTP статусу інструментів
LAST_HTTP_STATUS = None

# Патчимо методи requests, щоб перехоплювати status_code
_original_get = requests.get
_original_post = requests.post
_original_delete = requests.delete
_original_patch = requests.patch

def _patched_get(*args, **kwargs):
    global LAST_HTTP_STATUS
    res = _original_get(*args, **kwargs)
    LAST_HTTP_STATUS = res.status_code
    return res

def _patched_post(*args, **kwargs):
    global LAST_HTTP_STATUS
    res = _original_post(*args, **kwargs)
    LAST_HTTP_STATUS = res.status_code
    return res

def _patched_delete(*args, **kwargs):
    global LAST_HTTP_STATUS
    res = _original_delete(*args, **kwargs)
    LAST_HTTP_STATUS = res.status_code
    return res

def _patched_patch(*args, **kwargs):
    global LAST_HTTP_STATUS
    res = _original_patch(*args, **kwargs)
    LAST_HTTP_STATUS = res.status_code
    return res

requests.get = _patched_get
requests.post = _patched_post
requests.delete = _patched_delete
requests.patch = _patched_patch

from tracing import log_step, reset_log
from guardrails import assert_tool_allowed, validate_input_params, GuardrailError, max_steps_instruction

EXPRESS_API_URL = os.getenv("EXPRESS_API_URL", "http://localhost:4000/api")
API_KEY = os.getenv("OPENAI_API_KEY")
BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.groq.com/openai/v1")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

if not API_KEY:
    print("❌ Додай OPENAI_API_KEY у файл agent/.env!", file=sys.stderr)
    sys.exit(1)

# Створюємо стандартний OpenAI-клієнт для Groq
client = OpenAI(
    api_key=API_KEY,
    base_url=BASE_URL
)

# Fallback клієнт видалено за запитом
# fallback_client = None
# if OPENROUTER_API_KEY:
#     fallback_client = OpenAI(
#         api_key=OPENROUTER_API_KEY,
#         base_url="https://openrouter.ai/api/v1"
#     )

# Глобальна змінна для збереження JWT Токена
JWT_TOKEN = None

def login_agent():
    """Авторизація агента в Express API за допомогою JWT."""
    global JWT_TOKEN
    print("🔐 Авторизація агента в Express API...")
    try:
        res = requests.post(
            f"{EXPRESS_API_URL}/auth/login",
            json={
                "email": os.getenv("AGENT_EMAIL"),
                "password": os.getenv("AGENT_PASSWORD")
            },
            timeout=5
        )
        if res.status_code == 200:
            JWT_TOKEN = res.json().get("access_token")
            print("✅ JWT Токен успішно отримано!\n")
        else:
            print(f"❌ Помилка авторизації [{res.status_code}]: {res.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Не вдалося підключитися до API: {e}")
        sys.exit(1)

def get_auth_headers() -> dict:
    """Формує HTTP-заголовки з Bearer JWT токеном."""
    global JWT_TOKEN
    if not JWT_TOKEN:
        login_agent()
    return {"Authorization": f"Bearer {JWT_TOKEN}"}

# === 1. Визначення інструментів (Tools) ===

def get_planets() -> str:
    try:
        res = requests.get(f"{EXPRESS_API_URL}/planets", headers=get_auth_headers(), timeout=5)
        res.encoding = 'utf-8'
        return res.text
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def create_planet(name: str, danger_level: str = "low", description: str = "") -> str:
    try:
        payload = {"name": name, "danger_level": danger_level, "description": description}
        res = requests.post(f"{EXPRESS_API_URL}/planets", json=payload, headers=get_auth_headers(), timeout=5)
        res.encoding = 'utf-8'
        return res.text
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def delete_planet(planet_id: int) -> str:
    try:
        res = requests.delete(f"{EXPRESS_API_URL}/planets/{int(planet_id)}", headers=get_auth_headers(), timeout=5)
        res.encoding = 'utf-8'
        if res.status_code == 204:
            return json.dumps({"status": "success", "message": "Planet moved to trash."})
        return res.text or json.dumps({"error": f"API error {res.status_code}"})
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def restore_planet(planet_id: int) -> str:
    try:
        res = requests.patch(f"{EXPRESS_API_URL}/planets/{int(planet_id)}/restore", headers=get_auth_headers(), timeout=5)
        res.encoding = 'utf-8'
        return res.text
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def get_crew() -> str:
    try:
        res1 = requests.get(f"{EXPRESS_API_URL}/crew", headers=get_auth_headers(), timeout=5)
        res2 = requests.get(f"{EXPRESS_API_URL}/crew?fired=true", headers=get_auth_headers(), timeout=5)
        if res1.status_code == 200 and res2.status_code == 200:
            active = res1.json()
            fired = res2.json()
            return json.dumps(active + fired, ensure_ascii=False)
        res1.encoding = 'utf-8'
        return res1.text
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def create_crew_member(name: str, role: str) -> str:
    try:
        payload = {"name": name, "role": role}
        res = requests.post(f"{EXPRESS_API_URL}/crew", json=payload, headers=get_auth_headers(), timeout=5)
        res.encoding = 'utf-8'
        return res.text
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def get_clients(search: str = None) -> str:
    try:
        params = {}
        if search:
            params["search"] = search
        res = requests.get(f"{EXPRESS_API_URL}/clients", headers=get_auth_headers(), params=params, timeout=5)
        res.encoding = 'utf-8'
        return res.text
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def create_client(name: str, is_evil: bool = False, description: str = "") -> str:
    try:
        payload = {"name": name, "is_evil": is_evil, "description": description}
        res = requests.post(f"{EXPRESS_API_URL}/clients", json=payload, headers=get_auth_headers(), timeout=5)
        res.encoding = 'utf-8'
        return res.text
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def delete_client(client_id: int) -> str:
    try:
        res = requests.delete(f"{EXPRESS_API_URL}/clients/{int(client_id)}", headers=get_auth_headers(), timeout=5)
        res.encoding = 'utf-8'
        if res.status_code == 204:
            return json.dumps({"status": "success", "message": "Client moved to trash."})
        return res.text or json.dumps({"error": f"API error {res.status_code}"})
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def restore_client(client_id: int) -> str:
    try:
        res = requests.patch(f"{EXPRESS_API_URL}/clients/{int(client_id)}/restore", headers=get_auth_headers(), timeout=5)
        res.encoding = 'utf-8'
        return res.text
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def create_delivery(cargo_name: str, reward_cash: float, planet_id: int, client_id: int) -> str:
    try:
        payload = {
            "cargo_name": cargo_name,
            "reward_cash": float(reward_cash),
            "planet_id": int(planet_id),
            "client_id": int(client_id)
        }
        res = requests.post(f"{EXPRESS_API_URL}/deliveries", json=payload, headers=get_auth_headers(), timeout=5)
        res.encoding = 'utf-8'
        return res.text
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def assign_crew_member(delivery_id: int, crew_member_id: int, role_on_ship: str) -> str:
    try:
        payload = {
            "delivery_id": int(delivery_id),
            "crew_member_id": int(crew_member_id),
            "role_on_ship": role_on_ship
        }
        res = requests.post(f"{EXPRESS_API_URL}/assignments", json=payload, headers=get_auth_headers(), timeout=5)
        res.encoding = 'utf-8'
        return res.text
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def get_delivery_details(delivery_id: int) -> str:
    try:
        res = requests.get(f"{EXPRESS_API_URL}/deliveries/{delivery_id}", headers=get_auth_headers(), timeout=5)
        res.encoding = 'utf-8'
        return res.text
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def update_delivery_status(delivery_id: int, status: str) -> str:
    try:
        payload = {"status": status}
        res = requests.patch(f"{EXPRESS_API_URL}/deliveries/{int(delivery_id)}", json=payload, headers=get_auth_headers(), timeout=5)
        res.encoding = 'utf-8'
        return res.text
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def fire_crew_member(crew_member_id: int, reason: str = "") -> str:
    try:
        res = requests.delete(f"{EXPRESS_API_URL}/crew/{int(crew_member_id)}", json={"reason": reason}, headers=get_auth_headers(), timeout=5)
        res.encoding = 'utf-8'
        if res.status_code == 204:
            return json.dumps({"status": "success", "message": "Crew member fired successfully."})
        return res.text or json.dumps({"error": f"API error {res.status_code}"})
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

def restore_crew_member(crew_member_id: int) -> str:
    try:
        res = requests.patch(f"{EXPRESS_API_URL}/crew/{int(crew_member_id)}/restore", headers=get_auth_headers(), timeout=5)
        res.encoding = 'utf-8'
        return res.text
    except Exception as e:
        return json.dumps({"error": "network_error", "message": str(e)})

# Карта функцій для автоматичного виклику
TOOL_MAP = {
    "get_planets": get_planets,
    "create_planet": create_planet,
    "delete_planet": delete_planet,
    "restore_planet": restore_planet,
    "get_crew": get_crew,
    "create_crew_member": create_crew_member,
    "get_clients": get_clients,
    "create_client": create_client,
    "delete_client": delete_client,
    "restore_client": restore_client,
    "create_delivery": create_delivery,
    "assign_crew_member": assign_crew_member,
    "get_delivery_details": get_delivery_details,
    "update_delivery_status": update_delivery_status,
    "fire_crew_member": fire_crew_member,
    "restore_crew_member": restore_crew_member
}

# Опис інструментів для LLM (JSON Schema)
TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "get_planets",
            "description": "Отримати список доступних планет з Express CRM API."
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_planet",
            "description": "Створити нову планету.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "danger_level": {"type": "string"},
                    "description": {"type": "string"}
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_planet",
            "description": "Перемістити планету в кошик (Soft delete). УВАГА: Якщо знаєш лише назву, спершу використай get_planets щоб знайти ID!",
            "parameters": {
                "type": "object",
                "properties": {
                    "planet_id": {"type": "integer"}
                },
                "required": ["planet_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "restore_planet",
            "description": "Відновити планету з кошика. УВАГА: Спершу використай get_planets щоб знайти ID!",
            "parameters": {
                "type": "object",
                "properties": {
                    "planet_id": {"type": "integer"}
                },
                "required": ["planet_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_crew",
            "description": "Отримати список членів екіпажу з Express CRM API."
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_crew_member",
            "description": "Створити нового працівника/члена екіпажу (напр. Scruffy).",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Ім'я працівника"},
                    "role": {"type": "string", "description": "Посада (напр. Janitor, Captain)"}
                },
                "required": ["name", "role"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_clients",
            "description": "Отримати список клієнтів.",
            "parameters": {
                "type": "object",
                "properties": {
                    "search": {"type": "string", "description": "Пошуковий запит за назвою клієнта"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_client",
            "description": "Створити нового клієнта (напр. MomCorp) в системі.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {"type": "string", "description": "Назва клієнта"},
                    "is_evil": {"type": "boolean", "description": "Чи є клієнт злим"},
                    "description": {"type": "string", "description": "Опис клієнта"}
                },
                "required": ["name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "delete_client",
            "description": "Перемістити клієнта в кошик (Soft delete). УВАГА: Спершу використай get_clients щоб знайти ID!",
            "parameters": {
                "type": "object",
                "properties": {
                    "client_id": {"type": "integer"}
                },
                "required": ["client_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "restore_client",
            "description": "Відновити клієнта з кошика. УВАГА: Спершу використай get_clients щоб знайти ID!",
            "parameters": {
                "type": "object",
                "properties": {
                    "client_id": {"type": "integer"}
                },
                "required": ["client_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_delivery",
            "description": "Створити нову доставку вантажу в CRM.",
            "parameters": {
                "type": "object",
                "properties": {
                    "cargo_name": {"type": "string", "description": "Назва вантажу (напр. Slurm Dispenser)"},
                    "reward_cash": {"type": "number", "description": "Винагорода в кредитах"},
                    "planet_id": {"type": "integer", "description": "ID планети призначення. Знайди через get_planets!"},
                    "client_id": {"type": "integer", "description": "ID клієнта. Знайди через get_clients!"}
                },
                "required": ["cargo_name", "reward_cash"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "assign_crew_member",
            "description": "Призначити члена екіпажу на конкретну доставку.",
            "parameters": {
                "type": "object",
                "properties": {
                    "delivery_id": {"type": "integer", "description": "ID доставки"},
                    "crew_member_id": {"type": "integer", "description": "ID члена екіпажу. Знайди через get_crew!"},
                    "role_on_ship": {"type": "string", "description": "Роль на кораблі (напр. Captain, Pilot, Cargo Loader)"}
                },
                "required": ["role_on_ship"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_delivery_details",
            "description": "Отримати повні деталі доставки за її ID (включаючи планету, клієнта, екіпаж та лог польоту).",
            "parameters": {
                "type": "object",
                "properties": {
                    "delivery_id": {"type": "integer", "description": "ID доставки"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_delivery_status",
            "description": "Оновити статус доставки (pending, in_progress, completed, cancelled).",
            "parameters": {
                "type": "object",
                "properties": {
                    "delivery_id": {"type": "integer", "description": "ID доставки"},
                    "status": {"type": "string", "description": "Новий статус (pending, in_progress, completed, cancelled)"}
                },
                "required": ["status"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "fire_crew_member",
            "description": "Звільнити члена екіпажу за його ID. УВАГА: Якщо знаєш лише ім'я, ОБОВ'ЯЗКОВО спершу використай інструмент get_crew щоб знайти точний ID!",
            "parameters": {
                "type": "object",
                "properties": {
                    "crew_member_id": {"type": "integer", "description": "ID члена екіпажу, якого треба звільнити. Не вгадуй, знайди через get_crew!"},
                    "reason": {"type": "string", "description": "Причина звільнення"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "restore_crew_member",
            "description": "Відновити звільненого члена екіпажу. УВАГА: Спершу використай get_crew щоб знайти точний ID!",
            "parameters": {
                "type": "object",
                "properties": {
                    "crew_member_id": {"type": "integer", "description": "ID члена екіпажу. Не вгадуй, знайди через get_crew!"}
                }
            }
        }
    }
]

# === 2. Agent Loop ===
def run_agent(prompt: str, log_file: str = None):
    if log_file:
        from tracing import set_log_file
        set_log_file(log_file)
    reset_log()
    
    # Виконуємо первинну авторизацію перед запуском
    login_agent()
    
    print(f"🤖 Агент виконує: '{prompt}'...\n")
    log_step(0, "user_prompt", {}, prompt)

    sys_instructions = (
        "Ти AI-помічник Професора Фарнсворта у CRM Planet Express.\n"
        "Використовуй надані інструменти для роботи з планетами, екіпажем, клієнтами, доставками, призначеннями та логами польотів.\n"
        "КРИТИЧНО ВАЖЛИВО: НІКОЛИ, ЗА ЖОДНИХ ОБСТАВИН НЕ ВГАДУЙ ID (ідентифікатори)! "
        "Якщо користувач називає ім'я (наприклад, 'Бендер', 'Ліла', 'Earth'), ти ПОВИНЕН спершу викликати `get_crew`, `get_planets` або `get_clients`, "
        "щоб точно дізнатися їхні справжні ID у базі даних. Тільки після отримання результату з правильними ID ти можеш викликати інструменти, які потребують ID (наприклад, `fire_crew_member`, `create_delivery`). "
        "Якщо ти вгадаєш ID навмання, ти звільниш чи видалиш не ту людину!\n"
        "ВАЖЛИВО: Усі ідентифікатори (ID) в аргументах інструментів мають передаватися ВИКЛЮЧНО як числа (integer), а не як рядки (string). Наприклад, передавай 3, а не '3' або 'ідентифікатор'.\n"
        "ВАЖЛИВО: НІКОЛИ не викликай інструменти створення та залежні від них інструменти паралельно. "
        "Спочатку викликай інструмент створення, дочекайся відповіді з його реальним ID з бази даних, "
        "і лише тоді роби наступний виклик, використовуючи цей отриманий ID. Не вгадуй ID!\n"
        "ВАЖЛИВО: Зупиняйся і повертай фінальну текстову відповідь одразу, як тільки виконаєш завдання користувача. НЕ викликай зайві інструменти (видалення, оновлення тощо), якщо користувач про це не просив!\n"
        "Якщо користувач просто вітається або задає загальне питання, просто відповідай текстом. НЕ викликай інструменти, якщо тебе про це не просять.\n"
        f"УВАГА: {max_steps_instruction()}"
    )

    messages = [
        {"role": "system", "content": sys_instructions},
        {"role": "user", "content": prompt}
    ]

    step = 0
    max_steps = int(os.getenv("MAX_AGENT_STEPS", "12"))
    
    # Використовуємо лише основний клієнт
    current_model = os.getenv("OPENAI_MODEL", "llama-3.3-70b-versatile")

    while step < max_steps:
        step += 1

        try:
            response = client.chat.completions.create(
                model=current_model,
                messages=messages,
                tools=TOOLS_SCHEMA,
                tool_choice="auto",
                temperature=0.1
            )
        except Exception as e:
            error_str = str(e)
            
            # Check for Rate limit or 429
            if "Rate limit reached" in error_str or "429" in error_str:
                print("⚠️ Ліміт токенів API вичерпано. Спробуй пізніше.")
                break
            else:
                if "expected integer, but got string" in error_str:
                    error_msg = "Помилка LLM: Ти передав ID як рядок (string), а потрібно як число (integer)! Передавай число без лапок (наприклад, 3 замість '3')."
                elif "Failed to call a function" in error_str and "failed_generation" in error_str:
                    error_msg = "Помилка LLM: Ти згенерував синтаксично неправильний JSON (можливо, залишив значення порожніми: `\"id\": ,`). Якщо ти не знаєш ID — НЕ ВГАДУЙ і не залишай їх порожніми! Спершу використай get_planets, get_clients чи get_crew!"
                elif "did not match schema" in error_str:
                    error_msg = f"Помилка LLM: Твої параметри не відповідають схемі: {error_str}. Ніколи не передавай null чи рядки замість чисел. Якщо не знаєш ID, спершу використай інструменти пошуку!"
                elif "model_decommissioned" in error_str:
                    print(f"⚠️ Обрана модель більше не підтримується API: {error_str}")
                    break
                else:
                    error_msg = f"Помилка LLM: {error_str}. Спробуй ще раз з правильними параметрами."
                
                print(f"⚠️ {error_msg}")
                log_step(step, "agent_error", {}, error_str)
                messages.append({"role": "system", "content": error_msg})
                continue


        response_message = response.choices[0].message
        
        # Конвертуємо відповідь у словник, залишаючи лише базові поля,
        # оскільки OpenRouter та інші API можуть не підтримувати нові поля типу 'refusal'.
        message_dict = {"role": "assistant", "content": response_message.content}
        if response_message.tool_calls:
            unique_tool_calls = []
            seen_signatures = set()
            for tc in response_message.tool_calls:
                sig = f"{tc.function.name}:{tc.function.arguments}"
                if sig not in seen_signatures:
                    seen_signatures.add(sig)
                    unique_tool_calls.append(tc)
                else:
                    print(f"⚠️ Виявлено дубль виклику інструмента '{tc.function.name}'. Видаляємо дубль.")
            
            response_message.tool_calls = unique_tool_calls

            message_dict["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments
                    }
                }
                for tc in response_message.tool_calls
            ]
        messages.append(message_dict)
        
        if response_message.content:
            print(f"Agent thought: {response_message.content}")
            log_step(step, "agent_thought", {}, response_message.content)

        # Якщо модель не робить виклик інструментів — виводимо фінальну відповідь
        if not response_message.tool_calls:
            print("--- Final response ---")
            print(response_message.content)
            print(f"\nTrace saved to logs/trace.jsonl")
            return response_message.content

        # Обробка виклику інструментів
        for tool_call in response_message.tool_calls:
            function_name = tool_call.function.name
            raw_args = tool_call.function.arguments

            # Захист від None/порожніх аргументів
            if raw_args:
                try:
                    function_args = json.loads(raw_args)
                except Exception:
                    function_args = {}
            else:
                function_args = {}

            if not isinstance(function_args, dict):
                function_args = {}

            # Автоматична конвертація рядків в числа для ідентифікаторів,
            # оскільки деякі моделі (особливо Llama) вперто передають їх як рядки
            for key, value in list(function_args.items()):
                if isinstance(value, str):
                    if value.lower() in ("null", "none"):
                        function_args[key] = None
                        continue
                    if value.lower() == "true":
                        function_args[key] = True
                        continue
                    if value.lower() == "false":
                        function_args[key] = False
                        continue
                    if key.endswith("_id") or key == "reward_cash":
                        if value.isdigit():
                            function_args[key] = int(value)
                        else:
                            try:
                                function_args[key] = float(value) if key == "reward_cash" else int(value)
                            except ValueError:
                                pass

            print(f"Step {step}: Agent calls tool '{function_name}' with args: {function_args}")

            # Застосування Guardrails
            try:
                assert_tool_allowed(function_name)
                validate_input_params(function_name, function_args)
            except GuardrailError as ge:
                print(f"Guardrail Blocked: {ge}")
                function_response = json.dumps({"error": "guardrail_error", "message": str(ge)})
                log_step(step, function_name, function_args, function_response, error=str(ge))
                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": function_response
                })
                continue

            if function_name in TOOL_MAP:
                global LAST_HTTP_STATUS
                LAST_HTTP_STATUS = None
                
                function_response = TOOL_MAP[function_name](**function_args)
                
                # Додатково спробуємо логувати статус відповіді, якщо це JSON з помилкою
                error_msg = None
                try:
                    res_json = json.loads(function_response)
                    if "error" in res_json:
                        error_msg = res_json.get("message") or res_json.get("error")
                except Exception:
                    pass

                log_step(step, function_name, function_args, function_response, error=error_msg, http_status=LAST_HTTP_STATUS)

                messages.append({
                    "tool_call_id": tool_call.id,
                    "role": "tool",
                    "name": function_name,
                    "content": function_response
                })
            else:
                print(f"❌ Помилка: Невідомий інструмент {function_name}")

    print("⚠️ Перевищено максимальну кількість кроків агента!")
    return "Помилка: Перевищено максимальну кількість кроків."

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("prompt", nargs="?", default="Покажи список планет")
    args = parser.parse_args()

    run_agent(args.prompt)

if __name__ == "__main__":
    main()