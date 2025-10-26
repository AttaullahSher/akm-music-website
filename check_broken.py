import pandas as pd
import requests

# Read Excel
df = pd.read_excel('assets/Products_List.xlsx')
accessories = df[df['Category'] == 'Accessories']

broken = []
working = 0

for i, row in accessories.iterrows():
    url = str(row['Description']).strip()
    if url.startswith('http'):
        try:
            response = requests.head(url, timeout=5)
            if response.status_code != 200:
                broken.append((row['ID/SKU'], url, response.status_code))
            else:
                working += 1
        except Exception as e:
            broken.append((row['ID/SKU'], url, str(e)))
    else:
        broken.append((row['ID/SKU'], url, 'No URL'))

    if len(broken) >= 10:  # Check first 10 broken
        break

print(f'Working URLs: {working}')
print(f'Broken URLs found: {len(broken)}')
for sku, url, status in broken:
    print(f'{sku}: {status} - {url[:50]}...')
