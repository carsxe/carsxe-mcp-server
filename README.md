# 🚗 CarsXE MCP Server

A modular, extensible Model Context Protocol (MCP) server for querying and analyzing vehicle data from the [CarsXE API](https://api.carsxe.com/), with beautiful, chat-friendly Markdown output for LLMs and chatbots.

---

## ℹ️ What is CarsXE MCP Server?

The CarsXE MCP server is a **Node.js/TypeScript** application that exposes a suite of tools for querying comprehensive vehicle data from the CarsXE API. It is designed for seamless integration with LLMs (like Anthropic Claude, OpenAI GPT, etc.), chatbots, and developer tools, providing:

- 🧩 **Clean, modular code** for each CarsXE endpoint
- 📝 **Consistent, Markdown-rich output** for chat/LLM environments
- 🛡️ **Robust error handling** and user-friendly messages
- 🔌 **Easy extensibility** for new endpoints and features

---

## 💡 Why Use CarsXE with MCP?

Connecting CarsXE to your AI editor or chat client via MCP gives you a supercharged vehicle data experience — directly inside the tools you already use:

| Benefit                           | Description                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| **Ask in plain English**          | No need to know API endpoints or parameters — just describe what you want                   |
| **Context-aware answers**         | The AI combines live vehicle data with your question for tailored, actionable responses     |
| **No tab switching**              | Get VIN specs, history, recalls, and values without leaving your editor or chat             |
| **Chain requests effortlessly**   | Decode a plate → get full specs → check recalls → get market value, all in one conversation |
| **Always live data**              | Every query hits the CarsXE API in real time — no stale cache or outdated results           |
| **Works in your favorite editor** | Claude Desktop, Cursor, VS Code, Windsurf, and any MCP-compatible client                    |

---

## ✨ Features

- 🤖 Uses Anthropic Claude to generate comprehensive, professional answers based on the API data and user query
- 🚙 Query vehicle specs, history, images, recalls, market value, and more
- 🏷️ Decode license plates and VINs (including OCR from images)
- 🛠️ Decode OBD (On-Board Diagnostics) codes
- 🎨 All endpoints return elegant, grouped, emoji-rich Markdown
- 🧑‍💻 Modular code: types, API logic, and formatters are separated for maintainability
- 🧪 Simple to run, test, and extend

---

## ⚙️ Prerequisites

**CarsXE API key** ([get one here](https://api.carsxe.com/dashboard/developer))

---

## 🖥️ Installation by Editor

All editors use the same remote MCP endpoint. Replace `YOUR_API_KEY` with your actual CarsXE API key in every config below.

---

### Claude Desktop

#### 1️⃣ Download and Install Claude Desktop

- Go to the official [Claude Desktop download page](https://claude.ai/download)
- Download the installer for your operating system (macOS, Windows, or Linux)
- Install Claude Desktop by following the on-screen instructions

#### 2️⃣ Configure Claude Desktop to Use the CarsXE MCP Server

**a. Open Claude Desktop Settings**

- Launch the Claude Desktop app
- Click on **Claude** in the menu bar
- Select **Settings**
- In the Settings window, go to the **Developer** tab (you may need to scroll or expand advanced options)
- Click **Edit Config** (or **Open Config File**)

**b. Edit the Configuration File**

- This will open the `claude_desktop_config.json` file in your default text editor.
- Locate the `"mcpServers"` section. If it does not exist, add it as shown below.
- Add or update the following entry for CarsXE:

  ```json
  "mcpServers": {
    "carsxe": {
      "command": "npx",
      "args": [
        "mcp-remote@latest",
        "https://mcp.carsxe.com/mcp",
        "--header",
        "X-API-Key: YOUR_API_KEY"
      ]
    }
  },
  ```

- Replace `YOUR_API_KEY` with your actual CarsXE API Key
- **Tip:** You can add multiple MCP servers under `"mcpServers"` if you use more than one.
- **Save** the configuration file and close your editor.

**c. Restart Claude Desktop**

- Close and reopen the Claude Desktop app to apply the new configuration.

  > It may take a short delay for the changes to take effect.

#### 3️⃣ Verify the CarsXE MCP Server is Available

- After restarting, open Claude Desktop.
- Go to the tools or plugins section (usually in the search bar or under a tools menu).
- You should see **CarsXE** listed as an available MCP server/tool.
- Try running a CarsXE tool (e.g., get-vehicle-specs) to verify everything is working.
  > This will only work if your API key is associated with an active subscription.

---

### Cursor

[Install CarsXE MCP for Cursor](cursor://anysphere.cursor-deeplink/mcp/install?name=CarsXE&config=eyJuYW1lIjoiQ2Fyc1hFIiwidXJsIjoiaHR0cHM6Ly9tY3AuY2Fyc3hlLmNvbS9tY3AiLCJoZWFkZXJzIjp7IlgtQVBJLUtleSI6IllPVVJfQVBJX0tFWSJ9fQ==)

The install dialog will open pre-filled with:

| Field      | Value                      |
| ---------- | -------------------------- |
| **Name**   | CarsXE                     |
| **Type**   | streamableHttp             |
| **URL**    | https://mcp.carsxe.com/mcp |
| **Header** | `X-API-Key: YOUR_API_KEY`  |

Replace `YOUR_API_KEY` with your actual [CarsXE API key](https://api.carsxe.com/dashboard/developer), then click **Install**.

---

### Visual Studio Code (GitHub Copilot)

[Install CarsXE MCP for VS Code](vscode:mcp/install?%7B%22name%22%3A%22CarsXE%22%2C%22url%22%3A%22https%3A%2F%2Fmcp.carsxe.com%2Fmcp%22%2C%22headers%22%3A%7B%22X-API-Key%22%3A%22YOUR_API_KEY%22%7D%7D)

After clicking install, you'll need to add your API key manually:

1. Open **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run **MCP: List Servers**
3. Find **CarsXE** in the list and click on it
4. Click **Show Configuration**
5. Replace `YOUR_API_KEY` with your actual [CarsXE API key](https://api.carsxe.com/dashboard/developer):

```json
   "CarsXE": {
     "type": "http",
     "url": "https://mcp.carsxe.com/mcp",
     "headers": {
       "X-API-Key": "YOUR_ACTUAL_KEY_HERE"
     }
   }
```

6. Save the file — VS Code will connect automatically.

> **Note:** Make sure you have the **GitHub Copilot** extension installed and agent mode enabled (`chat.agent.enabled` in VS Code settings).

---

### Windsurf

#### 1️⃣ Open MCP Configuration

- Go to **Windsurf Settings** → **MCP** (or press `Ctrl+,` and search for MCP)
- Click **"Edit Config"** to open `~/.codeium/windsurf/mcp_config.json`

#### 2️⃣ Add the CarsXE Server

```json
{
  "mcpServers": {
    "carsxe": {
      "command": "npx",
      "args": [
        "mcp-remote@latest",
        "https://mcp.carsxe.com/mcp",
        "--header",
        "X-API-Key: YOUR_API_KEY"
      ]
    }
  }
}
```

#### 3️⃣ Restart Windsurf

Reload the window or restart Windsurf. Open the Cascade chat panel — CarsXE tools will appear automatically.

---

### Other Editors (Manual / Generic)

For any other MCP-compatible client, register a remote MCP server using:

- **Endpoint:** `https://mcp.carsxe.com/mcp`
- **Transport:** HTTP (Streamable HTTP)
- **Auth header:** `X-API-Key: YOUR_API_KEY`

Consult your editor's MCP documentation for the exact configuration format.

---

## 🛠️ Available Tools & Example Prompts

Below is a list of all available CarsXE tools, their parameters, and example prompts. These prompts work in any MCP-connected client.

### 1. `get-vehicle-specs` 🚙

- **Description:** Get comprehensive vehicle specifications by VIN
- **Parameters:**
  - `vin` (string, required): 17-character Vehicle Identification Number
- **Example Prompts:**

  > What are the full specs for VIN `WBAFR7C57CC811956`?

  > Is this a V6 or V8? VIN: `WBAFR7C57CC811956`

  > What trim level is `WBAFR7C57CC811956`?

- **Output:** Markdown-formatted vehicle specs (year, make, model, engine, dimensions, colors, equipment, etc.)

---

### 2. `decode-vehicle-plate` 🏷️

- **Description:** Decode a vehicle's license plate to get VIN and basic info
- **Parameters:**
  - `plate` (string, required): License plate number
  - `state` (string, optional): State abbreviation (e.g., CA)
  - `country` (string, required, default: US): Country code
- **Example Prompts:**

  > What car has license plate `7XER187` in California?

  > Decode plate `7XER187` state `CA`

  > Look up the plate `ABC1234` in Texas

- **Output:** Markdown summary of decoded vehicle info (VIN, make, model, year, etc.)

---

### 3. `international-vin-decoder` 🌍

- **Description:** Decode an international VIN for detailed info
- **Parameters:**
  - `vin` (string, required): 17-character VIN
- **Example Prompts:**

  > Decode this European VIN: `WF0MXXGBWM8R43240`

  > What car is `WAUZZZ8K9AA123456`? It's a German VIN.

- **Output:** Markdown with international vehicle details (manufacturer, specs, emissions, etc.)

---

### 4. `get-market-value` 💰

- **Description:** Get estimated market value for a vehicle by VIN
- **Parameters:**
  - `vin` (string, required): 17-character VIN
  - `state` (string, optional): US state abbreviation
  - `mileage` (number, optional): Current mileage of the vehicle to adjust the market value
  - `condition` (string, optional): Overall condition of the vehicle — `excellent`, `clean`, `average`, or `rough`
- **Example Prompts:**

  > How much is `WBAFR7C57CC811956` worth?

  > I'm thinking of buying VIN `WBAFR7C57CC811956` — what's a fair price?

  > What's the trade-in value for `WBAFR7C57CC811956` in Florida with 45,000 miles in clean condition?

- **Output:** Markdown with market value breakdown (retail, trade-in, MSRP, etc.)

---

### 5. `get-vehicle-history` 🕓

- **Description:** Get a comprehensive vehicle history report by VIN
- **Parameters:**
  - `vin` (string, required): 17-character VIN
  - `format` (string, optional): Response format (json or xml)
- **Example Prompts:**

  > Has `WBAFR7C57CC811956` ever been in an accident?

  > Show me the full history for VIN `WBAFR7C57CC811956`

  > How many owners has `WBAFR7C57CC811956` had?

- **Output:** Markdown with history records (junk/salvage, insurance, brands, titles, odometer, etc.)

---

### 6. `get-vehicle-images` 🖼️

- **Description:** Get vehicle images by make, model, and filters
- **Parameters:**
  - `make` (string, required)
  - `model` (string, required)
  - `year`, `trim`, `color`, `transparent`, `angle`, `photoType`, `size`, `license`, `format` (all optional)
- **Example Prompts:**

  > Show me photos of a blue 2018 Toyota Tacoma

  > Get images of a red 2022 Ford Mustang GT

  > What does a white 2020 Tesla Model 3 look like?

- **Output:** Markdown with up to 5 images (links, thumbnails, details)

---

### 7. `get-vehicle-recalls` 🚨

- **Description:** Get vehicle recall information by VIN
- **Parameters:**
  - `vin` (string, required): 17-character VIN
- **Example Prompts:**

  > Does `1C4JJXR64PW696340` have any open recalls?

  > I just bought VIN `1C4JJXR64PW696340` — should I be worried about recalls?

  > Check for safety recalls on `WBAFR7C57CC811956`

- **Output:** Markdown with recall details (date, description, risk, remedy, status, etc.)

---

### 8. `recognize-plate-image` 🏷️

- **Description:** Recognize and extract license plate(s) from a vehicle image URL
- **Parameters:**
  - `imageUrl` (string, required): Direct URL to an image of a vehicle's license plate
- **Example Prompts:**

  > What's the plate number in this image? `https://api.carsxe.com/img/apis/plate_recognition.JPG`

  > Read the license plate from this photo: `[image URL]`

- **Output:** Markdown with detected plates, confidence scores, bounding boxes, vehicle type, etc.

---

### 9. `vin-ocr` 🔍

- **Description:** Extract the VIN from a vehicle image using OCR
- **Parameters:**
  - `imageUrl` (string, required): Direct URL to an image of a vehicle's VIN
- **Example Prompts:**

  > Extract the VIN from this image: `https://user-images.githubusercontent.com/5663423/30922082-64edb4fa-a3a8-11e7-873e-3fbcdce8ea3a.png`

  > What's the VIN in this photo? `https://res.cloudinary.com/carsxe/image/upload/q_auto/f_auto/v1713204144/base/images/vin-ocr/vin.jpg`

- **Output:** Markdown with detected VIN, confidence, bounding box, and candidates

---

### 10. `get-year-make-model` 📅

- **Description:** Get comprehensive vehicle info by year, make, model, and optional trim
- **Parameters:**
  - `year` (string, required)
  - `make` (string, required)
  - `model` (string, required)
  - `trim` (string, optional)
- **Example Prompts:**

  > What are the specs for a 2020 Toyota Camry?

  > Tell me about the 2019 Honda Civic Sport trim

  > What colors were available on the 2021 Ford F-150?

- **Output:** Markdown with vehicle details, colors, features, options, and packages

---

### 11. `decode-obd-code` 🛠️

- **Description:** Decode an OBD code and get diagnosis information
- **Parameters:**
  - `code` (string, required): OBD code (e.g., P0115)
- **Example Prompts:**

  > My check engine light is on with code `P0115` — what does it mean?

  > Decode OBD code `P0300`

  > I have a `C1234` code on my dashboard — is it serious?

- **Output:** Markdown with code, diagnosis, and date

---

### 12. `get-lien-theft` 🔒

- **Description:** Get lien and theft information for a vehicle by VIN
- **Parameters:**
  - `vin` (string, required): 17-character Vehicle Identification Number
- **Example Prompts:**

  > Is there a lien on `WBAFR7C57CC811956`?

  > I'm buying a used car with VIN `WBAFR7C57CC811956` — check if it's stolen

  > Verify the title is clean for `WBAFR7C57CC811956`

- **Output:** Markdown with lien holder information, theft records, recovery dates, and status

---

## 🔗 Chaining Tools — Power User Examples

The real power of CarsXE MCP comes from chaining tools in a single conversation:

**Scenario 1 — Pre-purchase due diligence:**

1. > Decode plate `7XER187` in California
2. > Now get its full history
3. > Does it have any open recalls?
4. > What's it worth if I buy it today?

**Scenario 2 — Spotted a car on the street:**

1. > Read the plate from this image: `[photo URL]`
2. > Look up that plate in Texas
3. > Show me photos of that car model

**Scenario 3 — Mechanic / service shop:**

1. > Decode this VIN from the dashboard photo: `[image URL]`
2. > Get its full specs
3. > My customer says the check engine code is P0300 — what does that mean for this vehicle?

---
