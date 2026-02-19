import os
from flask import Flask, render_template, request, url_for, redirect
import requests
import sys
from datetime import date 
from datetime import timedelta
import subprocess

today = date.today()
yesterday = str(today - timedelta(days = 3))

app = Flask(__name__)
app.config['SECRET_KEY'] = os.urandom(24).hex()

#@app.route("/")
#def home():
#    return(render_template("index.html"))

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def redirect_to_imgoatex(path):
    return redirect(f"https://imgoatex.arnaudlelievre.fr/{path}", code=302)

if __name__ == "__main__":
    app.run(debug=True)
