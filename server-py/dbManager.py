import sqlite3, os, json

def createGuildDb(name: str, guildId: str, path: str = "../") -> tuple:
    
    dbPath = os.path.join(path, f"{name}-{guildId}.db")
    if os.path.exists(dbPath): return (False, f"DB file '{name}-{guildId}.db' already exists")
    if not os.path.exists(path): os.mkdir(path)

    try:
        conn = sqlite3.connect(dbPath)
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS channels (
                id TEXT PRIMARY KEY,
                name TEXT,
                oldest_archived_message TEXT REFERENCES messages(id),
                newest_archived_message TEXT REFERENCES messages(id)
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                epoch INTEGER,
                author TEXT,
                content TEXT,
                channel_id TEXT,
                attachments TEXT,
                FOREIGN KEY(channel_id) REFERENCES channels(id),
                FOREIGN KEY(author) REFERENCES users(id)
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                global_name TEXT
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS failed_messages (
                id TEXT PRIMARY KEY,
                epoch INTEGER,
                author TEXT,
                content TEXT,
                channel_id TEXT,
                attachments TEXT,
                error TEXT
            )
        ''')

        conn.commit()
    
    except Exception as e:
        return {False, f"Failed to create '{name}-{guildId}.db':\n{e}"}

    return (True, f"Guild '{name}-{guildId}.db' created at '{path}{name}-{guildId}.db'")

def createDbConnection(name: str, guildId: str, path: str = "./") -> tuple:
    dbPath = os.path.join(path, f"{name}-{guildId}.db")
    if not os.path.exists(dbPath): (False, f"DB file '{dbPath}' could not be found")
    conn = sqlite3.connect(dbPath)
    return (True, conn)

# Data should be the 'messages' field from the given json
def addMessage(data: dict, dbConn: sqlite3.Connection) -> tuple:
    cursor = dbConn.cursor()
    
    try:
        attachments: str = json.dumps(data["attachments"])

        cursor.execute('''
            INSERT OR IGNORE INTO messages (id, epoch, author, content, channel_id, attachments)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data["id"],
            data["epoch"],
            data["author"],
            data["content"] if data["content"] != "" else None,
            data["channel_id"],
            attachments if attachments != "[]" else None
        ))
        dbConn.commit()

    except Exception as e:
        return (False, f"Could not add message:\n{e}")
    
    return (True, None)
    
def addChannel(data: dict, dbConn: sqlite3.Connection) -> tuple:
    cursor = dbConn.cursor()

    try:
        cursor.execute('''
            INSERT OR REPLACE INTO channels (id, name, oldest_archived_message, newest_archived_message)
            VALUES (?, ?, ?, ?)
        ''', (
            data["id"],
            data["name"],
            data["oldest_archived_message"] if data["oldest_archived_message"] != "" else None,
            data["newest_archived_message"] if data["newest_archived_message"] != "" else None
        ))
        dbConn.commit()

    except Exception as e:
        return (False, f"Could not add channel:\n{e}")

    return (True, None)

def addUser(data: dict, dbConn: sqlite3.Connection) -> tuple:
    cursor = dbConn.cursor()

    try:
        cursor.execute('''
            INSERT OR REPLACE INTO users (id, name, global_name)
            VALUES (?, ?, ?)
        ''', (
            data["id"],
            data["name"],
            data["global_name"]
        ))
        dbConn.commit()
        
    except Exception as e:
        return (False, f"Could not add user {data['name']}:\n{e}")
    
    return (True, None)

def addFailedMessage(data: dict, dbConn: sqlite3.Connection, error: str, logPath: str = "./") -> tuple:
    cursor = dbConn.cursor()

    try:
        attachments: str = json.dumps(data["attachments"])

        cursor.execute('''
            INSERT OR IGNORE INTO failed_messages (id, epoch, author, content, channel_id, attachments)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            data["id"],
            data["epoch"],
            data["author"],
            data["content"],
            data["channel_id"],
            attachments,
            error
        ))
        dbConn.commit()

    except Exception as e:
        logFailedMessage(data, error, logPath)
        return (False, f"Could not add message to Failed Messages table:\n{e}\n\nWriting message data to '{logPath}'")
    
    return (True, None)

def logFailedMessage(data: dict, error:str, logPath: str = "./"):
    pass