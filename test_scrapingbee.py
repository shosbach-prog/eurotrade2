from scrapingbee import ScrapingBeeClient

client = ScrapingBeeClient(api_key='DEIN_NEUER_API_KEY')

response = client.get('https://www.example.com')

print('Status:', response.status_code)
print(response.content[:500])
