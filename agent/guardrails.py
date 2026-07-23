import os

class GuardrailError(Exception):
  pass

# Список дозволених інструментів для агента
ALLOWED_TOOLS = {
  "get_planets",
  "get_crew",
  "get_clients",
  "create_client",
  "create_delivery",
  "assign_crew_member",
  "add_flight_log",
  "get_delivery_details",
  "fire_crew_member",
  "update_delivery_status",
  "restore_crew_member",
  "delete_client",
  "restore_client",
  "delete_planet",
  "restore_planet",
  "create_crew_member"
}

def assert_tool_allowed(tool_name: str):
  """Перевіряє, чи знаходиться інструмент у білому списку."""
  if tool_name not in ALLOWED_TOOLS:
    raise GuardrailError(f"Tool '{tool_name}' is not in the allowlist!")

def validate_input_params(tool_name: str, args: dict):
  """Базова перевірка параметрів інструментів для запобігання ін'єкціям чи невалідним даним."""
  if tool_name == "create_client":
    if not args.get("name") or not isinstance(args.get("name"), str):
      raise GuardrailError("create_client: 'name' must be a non-empty string.")
  elif tool_name == "create_crew_member":
    if not args.get("name") or not isinstance(args.get("name"), str):
      raise GuardrailError("create_crew_member: 'name' must be a non-empty string.")
    if not args.get("role") or not isinstance(args.get("role"), str):
      raise GuardrailError("create_crew_member: 'role' must be a non-empty string.")
  elif tool_name == "create_delivery":
    if not args.get("cargo_name") or not isinstance(args.get("cargo_name"), str):
      raise GuardrailError("create_delivery: 'cargo_name' must be a non-empty string.")
    if "reward_cash" in args and not isinstance(args.get("reward_cash"), (int, float)):
      raise GuardrailError("create_delivery: 'reward_cash' must be a number.")
    if "planet_id" in args and not isinstance(args.get("planet_id"), int):
      raise GuardrailError("create_delivery: 'planet_id' must be an integer.")
    if "client_id" in args and not isinstance(args.get("client_id"), int):
      raise GuardrailError("create_delivery: 'client_id' must be an integer.")
  elif tool_name == "assign_crew_member":
    if "delivery_id" in args and not isinstance(args.get("delivery_id"), int):
      raise GuardrailError("assign_crew_member: 'delivery_id' must be an integer.")
    if "crew_member_id" in args and not isinstance(args.get("crew_member_id"), int):
      raise GuardrailError("assign_crew_member: 'crew_member_id' must be an integer.")
    if not args.get("role_on_ship") or not isinstance(args.get("role_on_ship"), str):
      raise GuardrailError("assign_crew_member: 'role_on_ship' must be a non-empty string.")
  elif tool_name == "add_flight_log":
    if "delivery_id" in args and not isinstance(args.get("delivery_id"), int):
      raise GuardrailError("add_flight_log: 'delivery_id' must be an integer.")
    if not args.get("note") or not isinstance(args.get("note"), str):
      raise GuardrailError("add_flight_log: 'note' must be a non-empty string.")
  elif tool_name == "get_delivery_details":
    if "delivery_id" in args and not isinstance(args.get("delivery_id"), int):
      raise GuardrailError("get_delivery_details: 'delivery_id' must be an integer.")
  elif tool_name == "fire_crew_member":
    if "crew_member_id" in args and not isinstance(args.get("crew_member_id"), int):
      raise GuardrailError("fire_crew_member: 'crew_member_id' must be an integer.")
  elif tool_name == "update_delivery_status":
    if "delivery_id" in args and not isinstance(args.get("delivery_id"), int):
      raise GuardrailError("update_delivery_status: 'delivery_id' must be an integer.")
    if not args.get("status") or not isinstance(args.get("status"), str):
      raise GuardrailError("update_delivery_status: 'status' must be a non-empty string.")
  elif tool_name == "restore_crew_member":
    if "crew_member_id" in args and not isinstance(args.get("crew_member_id"), int):
      raise GuardrailError("restore_crew_member: 'crew_member_id' must be an integer.")
  elif tool_name in ["delete_client", "restore_client"]:
    if "client_id" in args and not isinstance(args.get("client_id"), int):
      raise GuardrailError(f"{tool_name}: 'client_id' must be an integer.")
  elif tool_name in ["delete_planet", "restore_planet"]:
    if "planet_id" in args and not isinstance(args.get("planet_id"), int):
      raise GuardrailError(f"{tool_name}: 'planet_id' must be an integer.")

def max_steps_instruction() -> str:
  max_steps = os.getenv("MAX_AGENT_STEPS", "12")
  return f" Do not perform more than {max_steps} steps."