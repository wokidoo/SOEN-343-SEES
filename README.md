# SOEN-343-SEES

## Development Setup Guide

### **1. Prerequisites**
Make sure you have the following installed on your system:

- **Python** (3.13.2) → [Download here](https://www.python.org/downloads/)


### **2. Set Up a Virtual Environment (Only the first time)**
Create and activate a virtual environment to keep dependencies organized.

#### **Mac/Linux**
```sh
python3 -m venv venv
source venv/bin/activate
```

#### **Windows (Command Prompt)**
```sh
python -m venv venv
venv\Scripts\activate
```

If you see `(venv)` in your terminal, the virtual environment is active.

### **2. Install Dependencies**
Run the following to install all required packages:

```sh
pip install -r requirements.txt
```

### **3. Set Up the Database**
Run migrations to set up the database schema:

```sh
python manage.py migrate
```

If using PostgreSQL, ensure your database is running and update the `.env` file accordingly.


### **4. Run the Development Server**
Start the Django development server:

```sh
python manage.py runserver
```

Visit `http://127.0.0.1:8000/` in your browser.

### Running the Frontend

#### 1. Entering the frented Directory

In the Terminal, run the following commands

```sh
cd frontend
```
#### 2. Installing npm dependencies

Then, run the following to install the npm dependencies

```sh
npm install
```

#### 3. Run the project

Finally, run the following in the terminal to run the project
```sh
npm run dev
```

and click on the 

```sh
localhost:3000
```

to access the webpage for the SEES

## **Additional Notes**
### **Database Migrations**
Whenever making changes to django models, it's important to migrate changes before running the server or pushing changes to the repo
```sh
python manage.py makemigrations
python manage.py migrate
``` 


