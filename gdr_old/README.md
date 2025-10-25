# Google Drive Forwarder

> [!WARNING]
> this has been superceded by `gdr2/`

This is a simple Node.js web server that forwards Google Drive download links. It's designed to help download large files from Google Drive on a machine with limited network access, by using another machine as a proxy.

## Installation

1.  Clone this repository.
2.  Navigate to the `gdr` directory.
3.  Install the dependencies:
    ```bash
    npm install
    ```

## Running the Server

To start the server, run the following command from the `gdr` directory:

```bash
npm start
```

The server will start on port 3000 and print a list of available IP addresses that you can use to connect to it from other devices on the same network.

## Usage

To download a file, make a GET request to the server's root URL with a `url` query parameter containing the Google Drive share link.

For example, if the server is running on `192.168.1.100`, you can download a file using `curl`:

```bash
curl "http://192.168.1.100:3000/?url=<YOUR_GOOGLE_DRIVE_SHARE_LINK>" -o <OUTPUT_FILENAME>
```

Replace `<YOUR_GOOGLE_DRIVE_SHARE_LINK>` with the actual share link and `<OUTPUT_FILENAME>` with the desired name for the downloaded file.

You can also open the same URL in a web browser to start the download.
