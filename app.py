from flask import Flask, render_template, jsonify, request
import os

app = Flask(__name__)

# Define the file path
DATA_FILE = "data/saved_boundaries.csv"

# Check if the file exists
if not os.path.exists(DATA_FILE):
    # Create the directory if it doesn't exist
    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    # Create an empty CSV file
    with open(DATA_FILE, 'w') as f:
        f.write('')  # Creates an empty file
    print(f"Created new file: {DATA_FILE}")
else:
    print(f"File already exists: {DATA_FILE}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/get_selected_boundaries', methods=['GET'])
def get_selected_boundaries():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            boundaries = [line.strip() for line in f.readlines()]
        return jsonify(boundaries)
    else:
        return jsonify([])

@app.route('/save_selected_boundaries', methods=['POST'])
def save_selected_boundaries():
    boundaries = request.json
    with open(DATA_FILE, 'w') as f:
        for boundary in boundaries:
            f.write(boundary + '\n')
    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)