# HaloFlow - Enterprise Workflow Automation

Welcome to **HaloFlow**, the centralized Workflow Automation solution developed for the **Halleyx Full Stack Engineer Challenge (2026)**.

HaloFlow allows organizations to abstract logic away from developers, providing business administrators with a drag-and-drop Visual Canvas to build, configure, route, and execute critical business operations like Expense Approvals, Employee Onboarding, and Wallet Fund Management.

## 🚀 Project Overview

This platform abandons hardcoded execution trees in favor of a **Visual Workflow Engine** combined with a robust **Dynamic Rule Evaluation Runtime**.
Administrators can outline precise execution paths by configuring conditional statements (`expr-eval`) that prioritize routes based on raw JSON data submitted dynamically during process execution.

## 🧩 How It Works (Step-by-Step)

1. **Define Schema**: An Administrator creates a new Workflow and strictly types the expected input data (e.g., `{"amount": "number", "department": "string"}`).
2. **Design Path**: Using the Visual Builder, the Administrator drags and drops Steps onto the canvas (`Task`, `Approval`, `Notification`).
3. **Bind Logic**: The Admin attaches Priority-based Rules to Steps (e.g., Priority 1: `amount > 10000` ➡️ `CEO Approval`).
4. **Formulate Context**: A User triggers a workflow execution by filling out an auto-generated form complying entirely with the Schema.
5. **Runtime Evaluation**: The Engine locally evaluates the inputs against the Rules, routing the workflow physically through the graph until it reaches an End state or encounters a Fault.
6. **Audit Logs**: Every executed rule, calculation duration, and branch trajectory is permanently logged to the database for regulatory compliance.

## ✨ Key Features

- **Visual Node Builder**: An advanced interactive canvas (`React Flow`) to position, configure, and wire execution steps visually.
- **Dynamic Rule Engine**: Embedded runtime logic evaluation. Maps strictly-typed input schemas (e.g., `{ amount: 200 }`) against dynamic strings (`amount > 100`) to ascertain the immediate `Next Step` dynamically.
- **RBAC (Role-Based Access Control)**: Discrete portals partitioned for `Admin` (Design & Rule Configuration), `Staff/Manager` (Approval Authorities), and `Employee` (Execution Triggers & Live Notifications).
- **Drag-and-Drop Priority Hierarchy**: Native DND capabilities (`@dnd-kit`) to sort Logical Rules by execution priority (e.g., checking `High Priority` limits before `DEFAULT` fallbacks).
- **Interactive Execution Terminals**: Granular live-tracking dashboards enabling developers and administrators to monitor ongoing executions with real-time payload logs, calculation durations, and final logic decisions.

## ⚡ Additional Capabilities & Upgrades Achieved

- **Performant State Management**: Optimized client state hydration heavily utilizing `Zustand` rather than Prop Drilling or heavy Context Providers.
- **Data Visualization**: Integrated telemetry and metrics via `Recharts` for real-time workflow throughput monitoring.
- **Wallet & Ecosystem Hooks**: Integrated Fund APIs extending standard node triggers to selectively deduct virtual organization funds directly via Workflow Actions.
- **Fallbacks & Safety Nets**: Configurable `DEFAULT` route-catching to explicitly ensure active traversal never fails silently due to mismatched inputs.

### 🔮 Future Upgrades / Architecture Scope

1. **Parallel Forking**: Expanding the dynamic logic engine to branch into concurrent processing trees (e.g., notifying `Finance` whilst simultaneously triggering an `IT Asset Task`).
2. **Cycle Caps & Loop Prevention**: Expanding iteration metrics allowing dynamic recursive task loops mapped specifically with max-retry caps.
3. **Webhooks / API Emitters**: Upgrading the "Notification" node entity to POST authenticated JSON payloads to external services (e.g., Slack, SendGrid).

## 🛠️ Tech Stack & Dependencies

### Frontend (Client)

- **Core**: React 19, Vite, JavaScript
- **State & Routing**: React Router DOM (v7), Zustand
- **UI Framework**: Tailwind CSS
- **Complex UI**: `reactflow` (Workflow Canvas Builder), `@dnd-kit/core` (Drag-and-drop hierarchy), `lucide-react` (Icons), `recharts` (Analytics).

### Backend (Server)

- **Core API**: Node.js, Express.js (v5)
- **Database & Persistence**: MongoDB, `mongoose` (v9)
- **Rule Engine / Security**: `expr-eval` (Safe logic string casting), `json-rules-engine`, `bcryptjs`, `jsonwebtoken`

## 🏛️ System Architecture

The application runs on a decoupled RESTful methodology:

1. **MongoDB Application Layer**: Serves as the single source of truth routing highly relational UUID constraints simulating a normalized graph structure (`Workflows` ➡️ `Steps` ➡️ `Rules`) whilst simultaneously supporting flexible `JSON` payloads for varying Schema Requirements.
2. **Node Server Engine**: Encapsulates the core logic traversal and bounds-checking. Uses robust schema sanitizers before injecting context objects into `expr-eval`, returning a binary boolean traversing the node tree.
3. **Vite React SPA**: Heavily translates graph links and metadata JSON blobs into visual `reactflow` canvases. Utilizes modular, custom components mapping input fields to defined schema endpoints transparently.

## ⚙️ Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Server (Local or an Atlas URI)
- Git & npm (or yarn)

### 1. Server Configuration

```bash
git clone https://github.com/ArunJeevan29/Halleyx_Workflow_Automation.git
cd Halleyx_Workflow_Automation/server

npm install

# Create a generic .env file with your variables:
# MONGO_URI=mongodb://localhost:27017/haloflow
# JWT_SECRET=super_secret_key

npm run dev
# The backend will default target http://localhost:5000
```

### 2. Client Configuration

Open a secondary terminal process:

```bash
cd Halleyx_Workflow_Automation/client
npm install
npm run dev
# The application will map to http://localhost:5173
```

## 🔌 API Overview (Request & Response Examples)

### 1. Create a Workflow

Initializes a new workflow container bounded by a strict JSON input schema.
**POST** `/workflows`
**Request Body:**

```json
{
  "name": "Capex Approval Process",
  "input_schema": {
    "amount": { "type": "number", "required": true },
    "justification": { "type": "string", "required": true }
  }
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "uuid-1234",
    "name": "Capex Approval Process",
    "version": 1,
    "input_schema": {
      "amount": { "type": "number", "required": true },
      "justification": { "type": "string", "required": true }
    }
  }
}
```

### 2. Execute a Workflow

Spawns a runtime execution instance checking inputs directly against the schema.
**POST** `/workflows/:workflow_id/execute`
**Request Body:**

```json
{
  "data": {
    "amount": 25000,
    "justification": "New Server Racks"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "execution_id": "exec-9876",
  "status": "in_progress",
  "current_step_id": "step-abc"
}
```

## 📖 Sample Enterprise Workflows

### 1. Capital Expenditure (CAPEX) Approval

_Schema Variables_: `{ amount: Number, department: String, risk_level: String }`

- **Step 1: Department Head Review (Type: Approval)**
  - _Rule 1 (Priority 1)_: `amount >= 50000 && risk_level == 'High'` ➡️ Traverses to **Board Escalation (Approval)**.
  - _Rule 2 (Priority 2)_: `amount < 50000` ➡️ Traverses to **Finance Alert (Notification)**.
  - _Rule 3 (Priority 3)_: `DEFAULT` ➡️ **Reject Request (Task)**.
- **Step 2: Finance Alert (Type: Notification)**
  - Sends email to `finance@company.com`. Ends execution.

### 2. Multi-Tier IT Employee Onboarding

_Schema Variables_: `{ role: String, location: String }`

- **Step 1: HR System Entry (Type: Task)**
  - _Rule 1_: `DEFAULT` ➡️ **Hardware Provision (Task)**
- **Step 2: Hardware Provision (Type: Task)**
  - _Rule 1_: `location == 'Remote'` ➡️ **Ship Laptop (Task)**
  - _Rule 2_: `DEFAULT` ➡️ **Desk Setup (Task)**
- **Step 3 (Branching): Ship Laptop OR Desk Setup**
  - Both nodes merge execution paths into **Notify Manager (Notification)**. Ends execution.

## 🖼️ Screenshots

### 1. Visual Workflow Builder Canvas

![Visual Workflow Builder](./client/screenshots/workflowbuilder1.png)
_An interactive canvas utilizing React Flow to map complex institutional logic visually._

### 2. Administrator Executive Dashboard

![Executive Dashboard](./client/screenshots/dashboard.png)
_Real-time metrics and Recharts integrations tracking throughput._

### 3. Advanced Rule Configurations

![Rule Logic Config](./client/screenshots/workflowbuilder2.png)
_A drag-and-drop rule syntax parser allocating logic hierarchy actively via dnd-kit._

### 4. Real-Time Execution Log Terminal

![Execution Logs](./client/screenshots/executioncompletion2.png)
_Granular real-time metric tracking step-duration, resolved variables, and explicit logic assertions._

### 5. Specialized User Portals

![Staff Dashboard](./client/screenshots/staffdashboard.png)
_RBAC isolated portals allowing specific interactions like Approvals or Employee Triggers._

## 🎥 Demo Presentation Link

[Watch Full Demo Walkthrough Here](https://drive.google.com/file/d/1WK46rxyIvw7a6Oa8ScsOKrA09FlD6zls/view?usp=sharing)

---

_Built precisely for the 2026 Halleyx Full Stack Engineer Challenge._
