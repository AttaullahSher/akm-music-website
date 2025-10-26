import pandas as pd
import requests
from bs4 import BeautifulSoup
import time
import random
from urllib.parse import quote
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def search_google_images(query, num_results=1):
    """
    Search Google Images using Selenium and return the first image URL.
    """
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run in headless mode
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")

    driver = None
    try:
        driver = webdriver.Chrome(options=chrome_options)
        encoded_query = quote(query)
        url = f"https://www.google.com/search?q={encoded_query}&tbm=isch"
        driver.get(url)

        # Wait for images to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "img[data-src]"))
        )

        # Find image elements
        images = driver.find_elements(By.CSS_SELECTOR, "img[data-src]")

        for img in images:
            src = img.get_attribute("data-src") or img.get_attribute("src")
            if src and src.startswith('http') and 'google' not in src.lower() and not src.startswith('data:'):
                return src

        return None
    except Exception as e:
        print(f"Error searching for {query}: {e}")
        return None
    finally:
        if driver:
            driver.quit()

def check_url_status(url):
    """Check if URL is accessible."""
    try:
        response = requests.head(url, timeout=5)
        return response.status_code == 200
    except:
        return False

def update_excel_with_images(excel_path, category_filter=None, limit=None):
    """
    Update Excel file with image URLs for products that have broken URLs in description.
    """
    # Read Excel
    df = pd.read_excel(excel_path)

    # Filter by category if specified
    if category_filter:
        df = df[df['Category'] == category_filter]

    # Limit if specified
    if limit:
        df = df.head(limit)

    updated_count = 0

    for index, row in df.iterrows():
        sku = str(row['ID/SKU']).strip()
        name = str(row['Name']).strip()
        brand = str(row['Brand']).strip()
        category = str(row['Category']).strip()
        description = str(row['Description']).strip()

        # Check if URL in description is broken
        url_match = description
        if url_match.startswith('http') and not check_url_status(url_match):
            # Construct search query
            query = f"{brand} {name} {sku}".strip()

            print(f"Searching for: {query} (broken URL: {url_match[:50]}...)")

            # Search Google Images
            image_url = search_google_images(query)

            if image_url:
                # Replace broken URL with new one
                df.at[index, 'Description'] = image_url
                updated_count += 1
                print(f"Updated {sku} with {image_url}")
            else:
                print(f"No image found for {sku}")

            # Delay to avoid rate limiting
            time.sleep(random.uniform(1, 3))

    # Save updated Excel
    updated_path = excel_path.replace('.xlsx', '_updated.xlsx')
    df.to_excel(updated_path, index=False)
    print(f"Updated {updated_count} products. Saved to {updated_path}")

if __name__ == "__main__":
    # Update Accessories category with limit for demo
    update_excel_with_images('assets/Products_List.xlsx', category_filter='Accessories', limit=5)
