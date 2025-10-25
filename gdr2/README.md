# Google drive downloader 2

> [!TIP]
> run code inside the gdr2/ folder. this is separate from the top level project

Let's make gdr2, a successor to gdr. It downloads this hard coded link: 

https://drive.google.com/file/d/1nXjm6xDhWX_TkTD-vrElYGzpKk5NBw6m/view?usp=drivesdk

It is 6.9 gb zip, so you should be prepared to encounter a "this file is too large to scam" error.

I am on slow 10 mbps WiFi, and it goes in and out. This means downloading should be interruptible. How? Chunks

Hopefully, the Google drive download supports http ranges. Save 10 MB chunks as chunks/chunk0000 and so on

The CLI should take one optional argument for testing, the number of chunks to download before exiting early. To test, you should write a bash script that clears the first 3 chunk ids and downloads 3 chunks, then confirms that the first chunk starts with the magic bytes of a zip. Use this test to ensure the code works. You should leave any console log statements used for debugging in the code so I can also use them to debug

The downloader should skip chunks already downloaded. It should also print the progress. When I use it, it will keep downloading chunks until it fails. Then I should be able to concatenate the chunks

Like gdr, this should be a node script. But it's not an HTTP server anymore
