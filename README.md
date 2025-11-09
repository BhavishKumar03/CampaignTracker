# Campaign Tracker

A simple web application for managing marketing campaigns with a clean, responsive interface.

## Features

- ✅ **Add Campaigns**: Create new marketing campaigns with name, client, start date, and status
- ✅ **View Campaigns**: Display all campaigns in a clean, organized list
- ✅ **Update Status**: Change campaign status (Active/Paused/Completed)
- ✅ **Delete Campaigns**: Remove campaigns when no longer needed
- ✅ **Dashboard Summary**: Overview of total, active, paused, and completed campaigns
- ✅ **Search & Filter**: Find campaigns by name, client, or status
- ✅ **Responsive Design**: Works on desktop, tablet, and mobile devices
- ✅ **Modern UI**: Clean interface with smooth animations and transitions

## Technology Stack

- **Backend**: Python Flask with REST API
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Database**: JSON file storage (no database setup required)
- **Styling**: Custom CSS with modern design patterns

## Installation & Setup

1. **Clone or download** the project files
2. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**:
   ```bash
   python app.py
   ```

4. **Open your browser** and navigate to `http://localhost:5000`

## API Endpoints

- `GET /api/campaigns` - Get all campaigns
- `POST /api/campaigns` - Add a new campaign
- `PUT /api/campaigns/<id>` - Update campaign status
- `DELETE /api/campaigns/<id>` - Delete a campaign
- `GET /api/dashboard` - Get dashboard summary

## Usage

### Adding a Campaign
1. Fill in the campaign form with:
   - Campaign Name
   - Client Name
   - Start Date
   - Status (Active/Paused/Completed)
2. Click "Add Campaign"

### Managing Campaigns
- **Edit**: Click the "Edit" button to change campaign status
- **Delete**: Click the "Delete" button and confirm
- **Search**: Use the search box to find specific campaigns
- **Filter**: Use the status dropdown to filter by campaign status

### Dashboard
The dashboard shows real-time statistics:
- Total campaigns
- Active campaigns
- Paused campaigns
- Completed campaigns

## File Structure

```
Campaign Tracker/
├── app.py              # Flask backend application
├── requirements.txt    # Python dependencies
├── README.md          # This file
├── campaigns.json     # Data storage (created automatically)
├── templates/
│   └── index.html     # Main HTML template
└── static/
    ├── style.css      # CSS styles
    └── script.js      # JavaScript functionality
```

## Data Storage

Campaigns are stored in a JSON file (`campaigns.json`) that is created automatically when you add your first campaign. The data structure includes:

```json
{
  "id": "unique-uuid",
  "name": "Campaign Name",
  "client": "Client Name",
  "start_date": "2024-01-01",
  "status": "Active",
  "created_at": "2024-01-01T12:00:00"
}
```

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is open source and available under the MIT License.