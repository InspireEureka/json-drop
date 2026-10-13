import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "python"))
import engine


def call(action, **kwargs):
    return json.loads(engine.handle(json.dumps({"action": action, **kwargs})))


class PythonDropEngineTest(unittest.TestCase):
    def test_round_trip_and_local_edit(self):
        original = "# file\nx = 1  # note\n\ndef f():\n    return x\n"
        self.assertEqual(call("open", source=original)["source"], original)
        changed = call("edit", path=[0], name="price", valueKind="number", value="2")
        self.assertTrue(changed["ok"])
        self.assertIn("price = 2  # note", changed["source"])
        self.assertIn("def f():\n    return x", changed["source"])

    def test_nested_add_and_comment_move(self):
        call("open", source="def f():\n    pass\n")
        added = call("add", path=[0], kind="variable", name="x", valueKind="number", value="3", view=[0])
        self.assertTrue(added["ok"])
        self.assertEqual(added["source"], "def f():\n    x = 3\n")
        call("open", source="x = 1\n# next\ny = 2\n")
        moved = call("up", path=[1])
        self.assertEqual(moved["source"], "# next\ny = 2\nx = 1\n")

    def test_invalid_import_is_preserved_and_locked(self):
        original = "def broken(:\n"
        result = call("open", source=original)
        self.assertTrue(result["readOnly"])
        self.assertEqual(result["source"], original)
        self.assertTrue(result["items"][0]["locked"])
        self.assertFalse(call("add", path=[], kind="variable", name="x", valueKind="number", value="1")["ok"])

    def test_invalid_edit_does_not_change_source(self):
        call("open", source="x = 1\n")
        result = call("edit", path=[0], name="x", valueKind="number", value="invalid")
        self.assertFalse(result["ok"])
        self.assertEqual(call("state")["source"], "x = 1\n")


if __name__ == "__main__":
    unittest.main()
