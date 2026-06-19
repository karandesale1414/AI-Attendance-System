import pandas as pd
import os

project_folder = os.path.dirname(os.path.abspath(__file__))

file_path = os.path.join(project_folder, "attendance.xlsx")

df = pd.DataFrame(columns=[
    "ID",
    "Name",
    "Date",
    "Entry Time",
    "Exit Time"
])

df.to_excel(file_path, index=False)

print("Saved Here:")
print(file_path)