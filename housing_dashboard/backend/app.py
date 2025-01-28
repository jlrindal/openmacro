import pandas as pd
import numpy as np
import numpy_financial as npf

print("Loading data...")
df_list_price = pd.read_csv("/Users/jeremy/PycharmProjects/FRED Scrape/median_list_price_area.csv")
df_hhi = pd.read_csv("/Users/jeremy/PycharmProjects/FRED Scrape/hhi_cities_allyears.csv")
df_interest_rate = pd.read_csv("/Users/jeremy/PycharmProjects/FRED Scrape/30_year_average_rate.csv")

df_list_price['Date'] = pd.to_datetime(df_list_price['Unnamed: 0'])
df_list_price = df_list_price.drop('Unnamed: 0', axis=1)
df_interest_rate['Date'] = pd.to_datetime(df_interest_rate['Date'])
df_hhi['Date'] = pd.to_datetime(df_hhi['Date'], format='%Y')

print("Filtering dates...")
filtered_list_price = df_list_price[
    (df_list_price['Date'].dt.month == 1) &
    (df_list_price['Date'].dt.day == 1)
    ]

df_interest_rate = df_interest_rate.sort_values('Date').ffill()


def split_city_state(column):
    cities_str, states_str = column.split(", ")
    cities = [city.strip() for city in cities_str.split("-")]
    states = [state.strip() for state in states_str.split("-")]
    return list(zip(cities, states * len(cities) if len(states) == 1 else states))


print("Creating HHI lookup dictionary...")
hhi_lookup = {}
for _, row in df_hhi.iterrows():
    if pd.notna(row['city']) and pd.notna(row['state_abbrev']):
        key = (row['city'].lower(), row['state_abbrev'], row['Date'].year)
        hhi_lookup[key] = row['hhi']

results = []
print("\nProcessing cities...")

for col in df_list_price.columns[1:]:
    try:
        city_state_pairs = split_city_state(col)
        if city_state_pairs and len(city_state_pairs) > 1:
            print(f"\nProcessing {col}")
    except:
        continue

    location_data = filtered_list_price[['Date', col]].dropna()
    location_data = location_data[location_data[col] != 0]

    for _, row in location_data.iterrows():
        date = row['Date']
        list_price = row[col]

        hhi_year = date.year
        hhi_values = []
        matched_locations = []

        for city, state in city_state_pairs:
            hhi = hhi_lookup.get((city.lower(), state, hhi_year))
            if hhi is not None:
                hhi_values.append(hhi)
                matched_locations.append(f"{city}, {state}")
                if len(city_state_pairs) > 1:
                    print(f"Found match for {city}, {state}")

        if not hhi_values:
            continue

        avg_hhi = np.mean(hhi_values)
        interest_rate = df_interest_rate[df_interest_rate['Date'] <= date]['Value'].iloc[-1]
        pmt = -npf.pmt((interest_rate / 100) / 12, 30 * 12, list_price * 0.8)
        ratio = (pmt * 12) / avg_hhi

        results.append({
            'date': date,
            'location': col,
            'matched_cities': ', '.join(matched_locations),
            'ratio': f"{ratio * 100:.2f}%",
            'median_price': list_price,
            'monthly_payment': pmt,
            'median_hhi': avg_hhi,
            'interest_rate': interest_rate,
            'cities_matched': len(matched_locations)
        })

print(f"\nTotal results found: {len(results)}")

if len(results) > 0:
    ratio_df = pd.DataFrame(results)
    ratio_df.to_csv("housing_affordability.csv", index=False)
    print("Results saved to housing_affordability.csv")

from flask import Flask, send_file
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

@app.route('/')  # Add root route
def home():
    return "Backend is running"

@app.route('/api/data')
def get_data():
    file_path = os.path.join(os.path.dirname(__file__), '..', 'housing_affordability.csv')
    return send_file(file_path)

if __name__ == '__main__':
    app.run(debug=True, port=5001)