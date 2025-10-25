# Asbemble JSON query to SQL
# Note -- your solution may or may
# not need to use something similar depending on how you
# do query scheduling

def assemble_sql(q):
    select = _select_to_sql(q.get("select", []))
    from_tbl = q["from"]
    where = _where_to_sql(q.get("where"))
    group_by = _group_by_to_sql(q.get("group_by"))
    order_by = _order_by_to_sql(q.get("order_by"))
    sql = f"SELECT {select} FROM {from_tbl} {where} {group_by} {order_by}"
    if q.get("limit"):
        sql += f" LIMIT {q['limit']}"
    return sql.strip()


def _where_to_sql(where):
    if not where:
        return ""
    parts = []
    for cond in where:
        col, op, val = cond["col"], cond["op"], cond["val"]
        if op == "eq":
            parts.append(f"{col} = '{val}'")
        if op == "neq":
            parts.append(f"{col} != '{val}'")
        elif op in ("lt", "lte", "gt", "gte"):
            sym = {"lt": "<", "lte": "<=", "gt": ">", "gte": ">="}[op]
            parts.append(f"{col} {sym} {val}")
        elif op == "between":
            low, high = val
            parts.append(f"{col} BETWEEN '{low}' AND '{high}'")
        elif op == "in":
            vals = ", ".join(f"'{v}'" for v in val)
            parts.append(f"{col} IN ({vals})")
    return "WHERE " + " AND ".join(parts)


def _select_to_sql(select):
    parts = []
    for item in select:
        if isinstance(item, str):
            parts.append(item)
        elif isinstance(item, dict):
            for func, col in item.items():
                parts.append(f"{func.upper()}({col})")
    return ", ".join(parts)


def _group_by_to_sql(group_by):
    if not group_by: return ""
    return "GROUP BY " + ", ".join(group_by)


def _order_by_to_sql(order_by):
    if not order_by: return ""
    parts = [f"{o['col']} {o.get('dir', 'asc').upper()}" for o in order_by]
    return "ORDER BY " + ", ".join(parts)
