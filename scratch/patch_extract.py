import re

py_file = "G:\\Other computers\\My laptop\\Google Drive\\2025\\Python Scripts\\tDose_pyside_v.0.45.py"
with open(py_file, 'r', encoding='utf-8') as f:
    py_content = f.read()

def extract_block(name):
    match = re.search(f'def _create_{name}_tab\(self\):(.*?)(?=def _create_)', py_content, re.DOTALL)
    if not match:
        match = re.search(f'def _create_{name}_tab\(self\):(.*)', py_content, re.DOTALL)
    return match.group(1) if match else ""

scales = ['pcl_r', 'aq10', 'sapas', 'cssrs', 'psqi', 'bis11']
for scale in scales:
    block = extract_block(scale)
    if block:
        # try to find the list of items
        items = re.search(r'(_items|sections)\s*=\s*(\[.*?\]|\{.*?\})', block, re.DOTALL)
        if items:
            with open(f'scratch/{scale}_items.txt', 'w', encoding='utf-8') as f:
                f.write(items.group(2))

print("Extraction complete.")
