# create routes for subpost module here
from flask import Blueprint, request, jsonify
from app.subpost.models import Subpost
from app import db