import re
import json

py_file = "G:\\Other computers\\My laptop\\Google Drive\\2025\\Python Scripts\\tDose_pyside_v.0.45.py"
with open(py_file, 'r', encoding='utf-8') as f:
    py_content = f.read()

def extract_block(name):
    match = re.search(f'def _create_{name}_tab\(self\):(.*?)(?=def _create_)', py_content, re.DOTALL)
    if not match:
        return ""
    return match.group(1)

# PANSS
panss_block = extract_block("panss")
panss_sections = re.search(r'sections\s*=\s*\{(.*?)\n\s*\}', panss_block, re.DOTALL)
if panss_sections:
    sections_text = panss_sections.group(1)
    with open('scratch/panss_raw.txt', 'w') as f:
        f.write(sections_text)

# AIMS
aims_block = extract_block("aims")
aims_items = re.search(r'body_items\s*=\s*\[(.*?)\]', aims_block, re.DOTALL)
if aims_items:
    with open('scratch/aims_raw.txt', 'w') as f:
        f.write(aims_items.group(1))

# MoCA
moca_block = extract_block("moca")
moca_items = re.search(r'moca_items\s*=\s*\[(.*?)\]', moca_block, re.DOTALL)
if moca_items:
    with open('scratch/moca_raw.txt', 'w') as f:
        f.write(moca_items.group(1))

print("Extracted raw texts.")
