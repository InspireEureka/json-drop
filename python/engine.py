"""Python Drop: CST model and conservative source transformations.

Runs in Pyodide. No user module is executed; compile() checks syntax only.
"""
import json
import keyword
import re
import ast

import libcst as cst

source = ""
module = cst.parse_module("")
read_only = ""


def ident(value):
    if not value.isidentifier() or keyword.iskeyword(value):
        raise ValueError("Scegli un nome Python valido.")
    return value


def value_code(kind, value):
    if kind == "text":
        return json.dumps(value, ensure_ascii=False)
    if kind == "number":
        if not re.fullmatch(r"-?(?:\d+)(?:\.\d+)?", value):
            raise ValueError("Inserisci un numero valido.")
        return value
    if kind == "variable":
        return ident(value)
    raise ValueError("Tipo di valore non supportato.")


def label(node):
    if isinstance(node, cst.FunctionDef) and not node.decorators:
        return "Funzione", node.name.value, True
    if isinstance(node, cst.ClassDef) and not node.decorators:
        return "Classe", node.name.value, True
    if isinstance(node, cst.If) and node.orelse is None:
        return "Se", module.code_for_node(node.test), True
    if isinstance(node, cst.For) and node.orelse is None and not node.asynchronous:
        return "Per ogni", module.code_for_node(node.target), True
    if isinstance(node, cst.While) and node.orelse is None:
        return "Finché", module.code_for_node(node.test), True
    if isinstance(node, cst.SimpleStatementLine) and len(node.body) == 1:
        item = node.body[0]
        if isinstance(item, cst.Assign) and len(item.targets) == 1:
            return "Variabile", module.code_for_node(item.targets[0].target), False
        if isinstance(item, (cst.Import, cst.ImportFrom)):
            return "Import", module.code_for_node(node).strip(), False
        if isinstance(item, cst.Return):
            return "Ritorna", module.code_for_node(node).strip(), False
        if isinstance(item, cst.Pass):
            return "Passa", "segnaposto", False
    return "Codice originale", module.code_for_node(node).strip().split("\n")[0][:90], False


def body_at(path):
    body = module.body
    for index in path:
        node = body[index]
        if not isinstance(node, (cst.FunctionDef, cst.ClassDef, cst.If, cst.For, cst.While)):
            raise ValueError("Questa struttura non contiene blocchi modificabili.")
        if isinstance(node.body, cst.IndentedBlock):
            body = node.body.body
        else:
            raise ValueError("Questa struttura resta codice originale.")
    return body


def describe(path=()):
    items = []
    for index, node in enumerate(body_at(path)):
        kind, title, nested = label(node)
        # An unsupported compound statement is deliberately opaque.
        if nested and not isinstance(node.body, cst.IndentedBlock):
            kind, nested = "Codice originale", False
        edit = None
        if isinstance(node, (cst.FunctionDef, cst.ClassDef)) and not node.decorators:
            edit = {"name": node.name.value}
        elif isinstance(node, cst.SimpleStatementLine) and len(node.body) == 1:
            small = node.body[0]
            if isinstance(small, cst.Assign) and len(small.targets) == 1 and isinstance(small.targets[0].target, cst.Name):
                value = small.value
                if isinstance(value, (cst.Integer, cst.Float)):
                    edit = {"name": small.targets[0].target.value, "valueKind": "number", "value": value.value}
                elif isinstance(value, cst.Name):
                    edit = {"name": small.targets[0].target.value, "valueKind": "variable", "value": value.value}
                elif isinstance(value, cst.SimpleString):
                    try:
                        text = ast.literal_eval(value.value)
                        if isinstance(text, str):
                            edit = {"name": small.targets[0].target.value, "valueKind": "text", "value": text}
                    except (SyntaxError, ValueError):
                        pass
        items.append({"path": list(path) + [index], "kind": kind,
                      "title": title, "nested": nested,
                      "preview": module.code_for_node(node).strip().split("\n")[0][:110],
                      "locked": kind == "Codice originale", "edit": edit})
    return items


def change_body(path, body):
    global module
    if not path:
        module = module.with_changes(body=tuple(body))
        return
    parent = path[:-1]
    index = path[-1]
    siblings = list(body_at(parent))
    node = siblings[index]
    siblings[index] = node.with_changes(body=node.body.with_changes(body=tuple(body)))
    change_body(parent, siblings)


def check(candidate):
    # Parse and compile, but never run imported code.
    compile(candidate, "<python-drop>", "exec")


def commit():
    global source
    candidate = module.code
    check(candidate)
    source = candidate


def template(data):
    kind = data["kind"]
    name = data.get("name", "elemento")
    if kind != "import":
        name = ident(name)
    if kind == "variable":
        code = f"{name} = {value_code(data.get('valueKind', 'number'), data.get('value', '0'))}\n"
    elif kind == "function":
        code = f"def {name}():\n    pass\n"
    elif kind == "class":
        code = f"class {name}:\n    pass\n"
    elif kind == "if":
        code = f"if {value_code(data.get('valueKind', 'variable'), data.get('value', 'True'))}:\n    pass\n"
    elif kind == "for":
        code = f"for {name} in range({int(data.get('count', 3))}):\n    pass\n"
    elif kind == "while":
        code = f"while {value_code(data.get('valueKind', 'variable'), data.get('value', 'True'))}:\n    pass\n"
    elif kind == "import":
        dotted = data.get("name", "")
        if not dotted or any(not part.isidentifier() or keyword.iskeyword(part) for part in dotted.split(".")):
            raise ValueError("Inserisci un nome di modulo valido.")
        code = f"import {dotted}\n"
    elif kind == "return":
        code = f"return {value_code(data.get('valueKind', 'number'), data.get('value', '0'))}\n"
    else:
        raise ValueError("Blocco non disponibile.")
    return cst.parse_statement(code, config=module.config_for_parsing)


def apply(data):
    global module, source, read_only
    action = data["action"]
    if action == "open":
        candidate = data["source"]
        try:
            check(candidate)
            parsed = cst.parse_module(candidate)
        except (SyntaxError, cst.ParserSyntaxError, ValueError) as error:
            source, read_only = candidate, str(error)
        else:
            module, source, read_only = parsed, candidate, ""
    elif action == "state":
        pass
    else:
        if read_only:
            raise ValueError("Il file è in sola lettura: " + read_only)
        previous = module
        try:
            path = tuple(data.get("path", []))
            if action == "add":
                siblings = list(body_at(path))
                new = template(data)
                if len(siblings) == 1 and label(siblings[0])[0] == "Passa":
                    siblings = [new]
                else:
                    siblings.append(new)
                change_body(path, siblings)
            elif action == "edit":
                parent, index = path[:-1], path[-1]
                siblings = list(body_at(parent))
                node = siblings[index]
                name = ident(data["name"])
                if isinstance(node, (cst.FunctionDef, cst.ClassDef)) and not node.decorators:
                    siblings[index] = node.with_changes(name=cst.Name(name))
                elif isinstance(node, cst.SimpleStatementLine) and len(node.body) == 1:
                    small = node.body[0]
                    if not isinstance(small, cst.Assign) or len(small.targets) != 1 or not isinstance(small.targets[0].target, cst.Name):
                        raise ValueError("Questo valore non è modificabile visualmente.")
                    value = cst.parse_expression(value_code(data["valueKind"], data["value"]),
                                                 config=module.config_for_parsing)
                    target = small.targets[0].with_changes(target=cst.Name(name))
                    siblings[index] = node.with_changes(body=[small.with_changes(targets=[target], value=value)])
                else:
                    raise ValueError("Questo blocco non è modificabile visualmente.")
                change_body(parent, siblings)
            elif action in ("up", "down", "delete", "duplicate"):
                parent, index = path[:-1], path[-1]
                siblings = list(body_at(parent))
                node = siblings[index]
                if label(node)[0] == "Codice originale":
                    raise ValueError("Questo blocco originale è protetto.")
                if action in ("up", "down"):
                    other = index + (-1 if action == "up" else 1)
                    if other < 0 or other >= len(siblings):
                        raise ValueError("Il blocco è già all'estremità.")
                    siblings[index], siblings[other] = siblings[other], siblings[index]
                elif action == "duplicate":
                    siblings.insert(index + 1, node)
                else:
                    siblings.pop(index)
                    if not siblings and parent:
                        siblings = [cst.parse_statement("pass\n", config=module.config_for_parsing)]
                change_body(parent, siblings)
            else:
                raise ValueError("Operazione sconosciuta.")
            commit()
        except Exception:
            module = previous
            raise
    if read_only:
        items = [{"path": [0], "kind": "Codice originale", "title": "File in sola lettura",
                  "nested": False, "preview": source.split("\n")[0][:110],
                  "locked": True, "edit": None}]
    else:
        items = describe(tuple(data.get("view", [])))
    return {"source": source, "items": items, "readOnly": read_only}


def handle(payload):
    try:
        return json.dumps({"ok": True, **apply(json.loads(payload))}, ensure_ascii=False)
    except Exception as error:
        return json.dumps({"ok": False, "error": str(error)}, ensure_ascii=False)
