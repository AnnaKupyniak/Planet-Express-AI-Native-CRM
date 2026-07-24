import os
import sys

# UTF-8 override removed to prevent 'I/O operation on closed file' error

import json
import requests
from dotenv import load_dotenv

load_dotenv()

# Додаємо поточну директорію до шляху імпорту
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from tracing import set_log_file
from main import run_agent, EXPRESS_API_URL

def verify_db_state(client_name: str, cargo_name: str):
    """
    Авторизується та перевіряє стан БД через REST API,
    щоб підтвердити, що агент успішно виконав бриф і не створив зайвих дублікатів.
    """
    print("\nStarting database state verification...")
    
    # 1. Отримуємо JWT
    login_res = requests.post(
        f"{EXPRESS_API_URL}/auth/login",
        json={"email": "professor@planetexpress.com", "password": "farnsworth123"},
        timeout=5
    )
    if login_res.status_code != 200:
        print("Error: Could not authorize for DB verification.")
        sys.exit(1)
        
    token = login_res.json().get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Отримуємо список доставлених замовлень
    deliveries_res = requests.get(f"{EXPRESS_API_URL}/deliveries", headers=headers, timeout=5)
    if deliveries_res.status_code != 200:
        print("Error: Could not fetch deliveries from API.")
        sys.exit(1)
        
    deliveries = deliveries_res.json()
    
    # Шукаємо створену доставку
    target_delivery = None
    duplicates_count = 0
    for d in deliveries:
        if d.get("cargo_name") == cargo_name:
            if d.get("client", {}).get("name") == client_name:
                duplicates_count += 1
                target_delivery = d
                
    if not target_delivery:
        print(f"Verification Error: Delivery '{cargo_name}' for client '{client_name}' not found in DB!")
        sys.exit(1)
        
    if duplicates_count > 1:
        print(f"Warning: Found {duplicates_count} delivery duplicates!")
        sys.exit(1)
        
    print(f"Delivery '{cargo_name}' successfully created!")
    print(f"   - Винагорода: {target_delivery.get('reward_cash')} кредитів")
    print(f"   - Клієнт: {target_delivery.get('client', {}).get('name')} (is_evil: {target_delivery.get('client', {}).get('is_evil')})")
    print(f"   - Планета: {target_delivery.get('planet', {}).get('name')}")
    
    # 3. Перевіряємо призначення екіпажу
    assignments = target_delivery.get("assignments", [])
    if not assignments:
        print("Verification Error: No crew assigned to delivery!")
        sys.exit(1)
        
    print("Crew assignments:")
    for a in assignments:
        print(f"   - Член екіпажу: {a.get('crew_member', {}).get('name')} | Роль: {a.get('role_on_ship')}")
        

        
    print("\nVERIFICATION SUCCESSFUL! Agent built correct relations without duplicates.")

def main():
    # Налаштовуємо логування кроків у logs/capstone-trace.jsonl
    log_path = os.path.join(os.path.dirname(__file__), "..", "logs", "capstone-trace.jsonl")
    set_log_file(log_path)
    
    brief = (
        "КРОК 1: Створи нового клієнта 'Lurr' (is_evil = True).\n"
        "КРОК 2: Використай get_clients, get_planets та get_crew, щоб знайти ID клієнта Lurr, планети 'Omicron Persei 8' та працівника 'Turanga Leela'.\n"
        "КРОК 3: Використовуючи ТІЛЬКИ числові ID, створи доставку 'Slurm Dispenser' (винагорода 5000).\n"
        "КРОК 4: Використовуючи числові ID, признач Turanga Leela на цю доставку як 'Captain'.\n"
        "У кінці виведи підсумок."
    )
    
    print("Starting Capstone AI-Agent...")
    print("================================================================================")
    
    # Запускаємо цикл агента
    run_agent(brief)
    
    print("================================================================================")
    
    # Перевіряємо стан БД
    verify_db_state("Lurr", "Slurm Dispenser")

if __name__ == "__main__":
    main()
