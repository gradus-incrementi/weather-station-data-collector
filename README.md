# Weather Station Data Collector

This is a simple weather station data collector.

I have an Ambient Weather WS-2902D Web G on my local network.

The idea is to have it send it's weather data to this server.

It stores it in a sqlite3 database.

Then it can server up the weather data that it has collected.

## Release Script

The release.js script is used to release the weather station data collector.

It should be used after all the code for a release has been committed.

It does a bunch of things:
- It figures out what the new version number should be.
- It updates the version number in the package.json file.
- It updates the version number in the README.md file.
- It commits the changes to the repository.
- It tags the commit with the new version number.
- It pushes the changes to the remote repository.
- It pings a web hook to notify portainer of the new release so it can pull down the changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
