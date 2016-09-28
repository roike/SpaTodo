#!/bin/bash
# project: SpaTodos
#dev_appserver.py --datastore_path=~/GoogleDrive/gaestorage/todos --port=8085 dispatch.yaml app.yaml chat/app.yaml todo/app.yaml
dev_appserver.py --port=8085 dispatch.yaml app.yaml chat/app.yaml todo/app.yaml
