
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

## 🖥️ Step-by-Step: Install and Configure Claude Desktop with CarsXE MCP Server

Follow these steps to set up Claude Desktop and connect it to our CarsXE MCP server:

### 1️⃣ Download and Install Claude Desktop

- Go to the official [Claude Desktop download page](https://claude.ai/download)
- Download the installer for your operating system (macOS, Windows, or Linux)
- Install Claude Desktop by following the on-screen instructions

### 2️⃣ Configure Claude Desktop to Use the CarsXE MCP Server

#### a. Open Claude Desktop Settings

- Launch the Claude Desktop app
- Click on **Claude** in the menu bar
- Select **Settings**
- In the Settings window, go to the **Developer** tab (you may need to scroll or expand advanced options)
- Click **Edit Config** (or **Open Config File**)

#### b. Edit the Configuration File

- This will open the `claude_desktop_config.json` file in your default text editor.
- Locate the `"mcpServers"` section. If it does not exist, add it as shown below.
- Add or update the following entry for CarsXE:

  ```json
  {
    "mcpServers": {
      "carsxe-remote": {
        "command": "npx",
        "args": [
          "mcp-remote@latest",
          "https://mcp.carsxe.com/mcp",
          "--header",
          "X-API-Key: API_KEY"
        ]
      }
    }
  }
  ```

- Replace `API_KEY` with your actual CarsXE API Key

- **Tip:** You can add multiple MCP servers under `"mcpServers"` if you use more than one.

- **Save** the configuration file and close your editor.

#### c. Restart Claude Desktop

- Close and reopen the Claude Desktop app to apply the new configuration.

  > It may take a short delay for the changes to take effect.

### 3️⃣ Verify the CarsXE MCP Server is Available

- After restarting, open Claude Desktop.
- Go to the tools or plugins section (usually in the search bar or under a tools menu).
- You should see **CarsXE** listed as an available MCP server/tool.
- Try running a CarsXE tool (e.g., get-vehicle-specs) to verify everything is working.
  > This will only work if your API key is associated with an active subscription.

## 🛠️ Available Tools & Example Prompts

Below is a list of all available CarsXE tools, their parameters, expected outputs, and example prompts for use in Claude Desktop.

### 1. `get-vehicle-specs` 🚙

- **Description:** Get comprehensive vehicle specifications by VIN
- **Parameters:**
  - `vin` (string, required): 17-character Vehicle Identification Number
- **⚡ Example Prompt:**
  > get specs for `WBAFR7C57CC811956`
- **Output:** Markdown-formatted vehicle specs (year, make, model, engine, dimensions, colors, equipment, etc.)

### 2. `decode-vehicle-plate` 🏷️

- **Description:** Decode a vehicle's license plate to get VIN and basic info
- **Parameters:**
  - `plate` (string, required): License plate number
  - `state` (string, optional): State abbreviation (e.g., CA)
  - `country` (string, required, default: US): Country code
- **⚡ Example Prompt:**
  > plate decoder: `7XER187` `CA`
- **Output:** Markdown summary of decoded vehicle info (VIN, make, model, year, etc.)

### Chaining Example

- **Plate Decoder → Get Specs:**
  1. > plate decoder: `7XER187` `CA`
  2. > get its specs
  - First, decodes the plate to get the VIN, then uses the VIN to fetch full vehicle specs with the `get-vehicle-specs` tool.

### 3. `international-vin-decoder` 🌍

- **Description:** Decode an international VIN for detailed info
- **Parameters:**
  - `vin` (string, required): 17-character VIN
- **⚡ Example Prompt:**
  > get specs for `WF0MXXGBWM8R43240`
- **Output:** Markdown with international vehicle details (manufacturer, specs, emissions, etc.)

### 4. `get-market-value` 💰

- **Description:** Get estimated market value for a vehicle by VIN
- **Parameters:**
  - `vin` (string, required): 17-character VIN
  - `state` (string, optional): US state abbreviation
  - `country` (string, optional): Country code
- **⚡ Example Prompt:**
  > market value for `WBAFR7C57CC811956`
- **Output:** Markdown with market value breakdown (retail, trade-in, MSRP, etc.)

### 5. `get-vehicle-history` 🕓

- **Description:** Get a comprehensive vehicle history report by VIN
- **Parameters:**
  - `vin` (string, required): 17-character VIN
  - `format` (string, optional): Response format (json or xml)
- **⚡ Example Prompt:**
  > vehicle history for `WBAFR7C57CC811956`
- **Output:** Markdown with history records (junk/salvage, insurance, brands, titles, odometer, etc.)

### 6. `get-vehicle-images` 🖼️

- **Description:** Get vehicle images by make, model, and filters
- **Parameters:**
  - `make` (string, required)
  - `model` (string, required)
  - `year`, `trim`, `color`, `transparent`, `angle`, `photoType`, `size`, `license`, `format` (all optional)
- **⚡ Example Prompt:**
  > get images for a `blue` `2018` `Toyota` `Tacoma`
- **Output:** Markdown with up to 5 images (links, thumbnails, details)

### 7. `get-vehicle-recalls` 🚨

- **Description:** Get vehicle recall information by VIN
- **Parameters:**
  - `vin` (string, required): 17-character VIN
- **⚡ Example Prompt:**
   > get vehicle recalls for `1C4JJXR64PW696340`
- **Output:** Markdown with recall details (date, description, risk, remedy, status, etc.)

### 8. `recognize-plate-image` 🏷️

- **Description:** Recognize and extract license plate(s) from a vehicle image URL
- **Parameters:**
  - `imageUrl` (string, required): Direct URL to an image of a vehicle's license plate
- **⚡ Example Prompt:**
  > get plate <https://api.carsxe.com/img/apis/plate_recognition.JPG>
- **Output:** Markdown with detected plates, confidence scores, bounding boxes, vehicle type, etc.

### 9. `vin-ocr` 🔍

- **Description:** Extract the VIN from a vehicle image using OCR
- **Parameters:**
  - `imageUrl` (string, required): Direct URL to an image of a vehicle's VIN
- **⚡Example Prompts:**

1. > vin ocr <https://user-images.githubusercontent.com/5663423/30922082-64edb4fa-a3a8-11e7-873e-3fbcdce8ea3a.png>

2. > vin ocr <https://res.cloudinary.com/carsxe/image/upload/q_auto/f_auto/v1713204144/base/images/vin-ocr/vin.jpg>

- **Output:** Markdown with detected VIN, confidence, bounding box, and candidates

### 10. `get-year-make-model` 📅

- **Description:** Get comprehensive vehicle info by year, make, model, and optional trim
- **Parameters:**
  - `year` (string, required)
  - `make` (string, required)
  - `model` (string, required)
  - `trim` (string, optional)
- **⚡ Example Prompt:**
  > ymm `Toyota` `Camry` `2020`
- **Output:** Markdown with vehicle details, colors, features, options, and packages

### 11. `decode-obd-code` 🛠️

- **Description:** Decode an OBD code and get diagnosis information
- **Parameters:**
  - `code` (string, required): OBD code (e.g., P0115)
- **⚡ Example Prompt:**
  > obd code `P0115`
- **Output:** Markdown with code, diagnosis, and date

---
