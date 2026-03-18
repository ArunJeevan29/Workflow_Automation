# ⚙️ Backend - Data & Logic API

> The core backend service handling persistence, schema validation, access authorizations, and runtime logic evaluation.

The server handles workflow logic progression by passing inputs directly to the local Dynamic Rules Engine natively validating business rules without hardcoded dependencies.

## 🚀 How to Run the Server
⚠️ **Requires MongoDB instance running locally or via Atlas**

Ensure your terminal is located within the `/server` directory.

**1. Configure Environment**
Create a `.env` file in the `/server` root directory:
```env
MONGO_URI=mongodb://localhost:27017/haloflow
JWT_SECRET=your_jwt_signing_key
PORT=5000
```

**2. Install and Run**
```bash
npm install
npm run dev

# The API starts on http://localhost:5000
```

## ✨ Core Backend Features
- **Dynamic Rule Engine**: Safely evaluates mathematical and logical string conditions (`expr-eval`) against raw JSON at runtime.
- **Strict Schema Validation**: Verifies dynamic user inputs match the strict type-requirements defined in a workflow's metadata.
- **Resilient Execution Tracks**: Step-by-step state saving enabling safe retries for failed workflow segments.
- **Comprehensive Audit Logging**: Permanently logs every rule evaluation and runtime outcome into historical execution documents.
- **Relational Data in NoSQL**: Utilizes explicit UUID mappings between Workflows, Steps, and Rules for high data integrity.

## 🔄 Execution Data Flow
1. **API receives execution request**: Hydrates input JSON against the defined Workflow `input_schema`.
2. **Initialization**: Creates an `Execution` record and determines the `start_step_id`.
3. **Step processing**: Validates Step instructions (Tasks, Approvals) and awaits user action if necessary.
4. **Rule evaluation**: Upon step completion, loads assigned Rules filtered by priority.
5. **Logic Routing**: Injects the executed JSON payload into the `expr-eval` engine. The first `true` statement dictates the `next_step_id`.
6. **Persistence**: Saves the traversal results, timestamps, and active state to MongoDB.

## 📡 API Endpoint Overview

### 1. Workflows Definitions (`/workflows`)
- `POST /workflows` - Generate new workflows with defined JSON `input_schema`.
- `GET /workflows` - Retrieve workflow lists (supports pagination and search queries).
- `GET /workflows/:id` - Fetch workflow details including nested steps and rule hierarchies.
- `PUT /workflows/:id` - Update workflows (automatically increments the `version` integer).

### 2. Logic & Steps (`/steps`, `/rules`)
- `POST /workflows/:workflow_id/steps` - Add a physical node mapped to standard logic types (`task`, `notification`, `approval`).
- `POST /steps/:step_id/rules` - Bind conditional logic (e.g., `condition: "amount > 900"`, `next_step: UUID`, `priority: 2`).

### 3. Execution Control (`/executions`)
- `POST /workflows/:workflow_id/execute` - Initializes a new workflow context and execution runtime.
- `GET /executions/:id` - Provides real-time read-outs defining node completion durations, faults, and branch forks taken.
- `POST /executions/:id/retry` - Safely retries an execution locally from the faulted `current_step_id` backward.

## 🗄️ Database Architecture (MongoDB + UUIDs)

- **Workflow Model**: `id` (UUID), `name`, `version`, `is_active`, `input_schema` (JSON Block).
- **Step Model**: `id` (UUID), `workflow_id` (FK), `step_type` (Enum), `order`, `metadata` (JSON).
- **Rule Model**: `id` (UUID), `step_id` (FK), `condition` (String mapping to logic formulas), `next_step_id` (Graph fork target), `priority` (Integer scale descending evaluation order).
- **Execution Model**: `id` (UUID), `workflow_id` (FK), `workflow_version` (Int), `status` (Enum), `data` (JSON runtime vars), `logs` (JSON Array), `current_step_id`.

## 🧠 Dynamic Rule Engine Structure
Instead of hardcoding route logic, HaloFlow handles logic routing processing on-the-fly:
1. **Extraction**: After completing a Step, the backend retrieves all nested Rules assigned to that Step, sequentially ordered by `priority`.
2. **Context Injection**: Utilizing `expr-eval`, the engine injects the runtime Execution data (`{ amount: 50 }`) into the formula strings.
3. **Evaluation Checks**:
   - If `true`: Overrides standard routing and forks to target `next_step_id`.
   - Continuous `false`: Checks fallback to a `DEFAULT` catcher constraint.
4. **Audit Metrics**: Syntax validation issues immediately mark executing containers as `FAILED` to handle errors safely. All paths map directly into the Mongo historical `logs` for transparency.
