from flask import Flask, request, jsonify
import queue, threading, dbManager, os, time

app = Flask(__name__)
dbQueue = queue.Queue() # Format: (guildId, jsonData, dataType) -- dataType 0 = msg, 1 = channel, 2 = user
connections: dict = {}
closeAll: bool = False

DB_PATH: str = "./db/"

@app.route("/add", methods=["POST"])
def queueMessages():
    data = request.json
    guildId = data.get("guild_id")
    guildName = data.get("guild_name")

    if not guildId or guildId == "":
        return jsonify({"error": "guild_id is required"}), 400
    
    if guildId not in connections:
        dbQueue.put((guildId, guildName, 3))

    messages = data.get("messages", [])
    if not messages:
        return jsonify({"status": "no messages"}), 200
    
    for msg in messages: # Add each message to the queue
        dbQueue.put((guildId, msg, 0))

    return jsonify({"status": "queued", "count": len(messages)}), 200

@app.route("/add-channel", methods=["POST"])
def queueChannel():
    data = request.json
    guildId = data.get("guild_id")
    guildName = data.get("guild_name")
    
    if not guildId or guildId == "":
        return jsonify({"error": "guild_id is required"}), 400

    if guildId not in connections:
        dbQueue.put((guildId, guildName, 3))

    channel = data.get("channel")
    if not channel:
        return jsonify({"status": "no channel"}), 200
    
    dbQueue.put((guildId, channel, 1))

@app.route("/create-guild", methods=["POST"])
def createGuild():
    data = request.json
    guildId = data.get("guild_id")
    guildName = data.get("guild_name")

    if not guildId or guildId == "":
        return jsonify({"error": "guild_id is required"}), 400
    
    status, msg = dbManager.createGuildDb(guildName, guildId, DB_PATH)
    return jsonify({"status": status, "msg": msg})

@app.route("/add-users", methods=["POST"])
def addUser():
    data = request.json
    guildId = data["guild_id"]
    guildName = data["guild_name"]

    if not guildId or guildId == "":
        return jsonify({"error": "guild_id is required"})
    
    if guildId not in connections:
        dbQueue.put((guildId, guildName, 3))
    
    users = data.get("users")
    if not users:
        return jsonify({"status": "No user"}), 200
    
    for user in users:
        dbQueue.put((guildId, user, 2))
    return jsonify({"status": "queued"})

def addDbConn(guildId: str, guildName: str) -> tuple:
    if guildId not in connections:
        success, conn = dbManager.createDbConnection(guildName, guildId, DB_PATH)
        if not success:
            return (False, f"Failed to connect to DB for guild {guildName}")
        connections[guildId] = conn
    return (True, None)

@app.route("/end", methods=["POST", "GET"])
def end():
    print("Waiting for queue manager to finish")
    dbQueue.put(None)
    dbQueue.join()
    print("finished")
    print("Shutting down server")
    while not closeAll: time.sleep(1)
    os._exit(0)

'''
def shutdown_server() -> tuple:
    func = request.environ.get('werkzeug.server.shutdown')
    if func is None:
        return (False, "Not running with the Werkzeug server")
    func()
    return (True, "")
'''

def queueManager() -> None:
    while True:
        try:
            item = dbQueue.get()
            if item == None:
                print("Closing db connections")
                for conn in connections.values():
                    conn.close()
                print("Breaking queue manager loop")
                return

            if item[2] == 0:    
                status, msg = dbManager.addMessage(item[1], connections[item[0]])
                if not status: 
                    print(f"{msg}\n\nAdding data to failed_messages table")
                    status, msg = dbManager.addFailedMessage(item[1], connections[item[0]])
                    if not status:
                        print(f"{msg}")

            elif item[2] == 1:
                status, msg = dbManager.addChannel(item[1], connections[item[0]])
                if not status: print(msg)

            elif item[2] == 2:
                status, msg = dbManager.addUser(item[1], connections[item[0]])
                if not status: print(msg)

            elif item[2] == 3:
                status, msg = addDbConn(item[0], item[1])
                if not status: print(msg)

        finally:
            dbQueue.task_done()

def runFlask():
    app.run()

def main():
    global closeAll

    flaskThread = threading.Thread(target=runFlask)
    flaskThread.start()     
    queueManager()
    #print("Waiting for queueManager to finish")
    #dbQueue.put(None)
    #dbQueue.join()
    #print("Waiting for Flask thread to close")
    #flaskThread.join()
    closeAll = True
    
    return

    queueThread = threading.Thread(target=queueManager)
    queueThread.start()
    app.run(port=5000)
    print("Waiting for queueManager to finish")
    dbQueue.put(None)
    dbQueue.join()
    queueThread.join()

    print("Closing db connections")
    
    for conn in connections.values():
        conn.close()

    print("Finished")

if __name__ == "__main__":
    main()