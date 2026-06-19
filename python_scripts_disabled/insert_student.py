import sqlite3

conn = sqlite3.connect("database.db")
cursor = conn.cursor()

name = input("Enter Student Name: ")

cursor.execute("INSERT INTO students (name) VALUES (?)", (name,))

conn.commit()
conn.close()

print("Student added successfully")