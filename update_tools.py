import sys, re

with open('frontend/src/config/tools.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove imports
text = re.sub(r'import \{.*?\} from ''lucide-react'';\n', '', text)
text = re.sub(r'import \{.*?\} from ''@/components/BrandIcons'';\n', '', text)

# Replace icon: Component, with iconUrl: '/icons/id.png',
new_tools = []
for block in text.split('{'):
    if 'id:' in block:
        id_match = re.search(r"id:\s*'([^']+)'", block)
        if id_match:
            tool_id = id_match.group(1)
            block = re.sub(r'icon:\s*[a-zA-Z0-9_]+,', f"iconUrl: '/icons/{tool_id}.png',", block)
    new_tools.append(block)

text = '{'.join(new_tools)

with open('frontend/src/config/tools.ts', 'w', encoding='utf-8') as f:
    f.write(text)
