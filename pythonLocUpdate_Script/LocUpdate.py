import json

import geojson
import time
from filelock import FileLock

# A script to read the drone dataset line by line and update the aiders.geojson file every 100ms
# which contains only the current row of the aiders datasetTest.

def readFile(filePath):
    with open(filePath) as f:
        gj = geojson.load(f)
    feature = gj['features'][0]
    print(feature)
    features = gj['features']
    writeSingleGeoPoint(features)

def writeSingleGeoPoint(features):
    for feature in features:
        lock = FileLock("aiders.geojson.lock")
        lock.acquire()
        print("Lock acquired.")
        with open('aiders.geojson', 'w') as f:
            json.dump(feature, f)
            print(feature)
            f.flush()
            f.close()
        with open('aiders2.geojson','w') as f:
            json.dump(feature,f)
            f.flush()
            f.close()

        lock.release()
        time.sleep(0.08)


def main():
    filePath = 'aidersDatasetTestRTK.geojson'
    while(True):
        readFile(filePath)


if __name__ == "__main__":
    main()