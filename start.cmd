set AZURE_SHARE=rater                
set AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=ksu2storage;AccountKey=RPpQHX//D9/2T0SbKFPWmhfwEZadQv9ucBUQLvlNhjjJPeFs6O2HdNJ7yuc/QGYEiDGedzo6x496qXqogOuRBw==;BlobEndpoint=https://ksu2storage.blob.core.windows.net/;TableEndpoint=https://ksu2storage.table.core.windows.net/;QueueEndpoint=https://ksu2storage.queue.core.windows.net/;FileEndpoint=https://ksu2storage.file.core.windows.net
set START_WEB=%1
set DEBUG=true
node --nolazy index.js