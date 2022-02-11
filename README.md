# TeslaBox
Lite, open-source version of [teslarpi.com](https://www.teslarpi.com).

Compresses Tesla dashcam and sentry clips, uploads to S3, notifies of events (along with a copy of each clip) via Telegram and allows remote streaming while parked or driving!

## Prerequisites
- Raspberry Pi 4 with at least 4GB of ram, case and fan
- Micro-SD card with at least 64GB of storage and reader
- USB-A to USB-C or USB-C to USB-C (all males) cable
- [AWS account](https://aws.amazon.com/)
- [Ngrok account](https://ngrok.com/) (free, or paid - for custom/static subdomains)
- [Telegram account](https://telegram.org/)

## Installation
For paid (priority) support please contact teslabox@payymail.com

### AWS (required for archiving)
1. Sign into your AWS account
2. Create a new S3 bucket as follows:
   - Bucket name: however you'd like (must be globally unique)
   - AWS region: either us-east-1 or the one closest to you
   - ACL Disabled
   - Block *all* public access
   - Bucket versioning: Disable
   - Default encryption: Disable
   - Click "Create Bucket"
3. Create a new IAM user as follows:
   - User name: whatever you'd like
   - Select AWS credential type: Access key: - Programmatic access
   - Click "Next: Permissions"
   - Click "Create Policy"
   - Service: S3
   - Actions: PutObject
   - Resource: Add ARN to restrict access and put your Bucket name from 2.1. and Object name any
   - Click "Next: Tags"
   - Click "Next: Review"
   - Name: "TeslaBox"
   - Click "Create Policy"
   - Back on the IAM user page, refresh the list of policies and check "TeslaBox"
   - Click "Next: Tags"
   - Click "Next: Review"
   - Click "Create User"
   - Copy both the Access key ID and Secret access key

### Ngrok (required for remote access)
1. Sign into your Ngrok account
2. Retrieve your secret auth token

### Telegram (required for notifications)
1. Sign into your Telegram account
2. Search and contact @Botfather user
3. Enter /newbot and follow the wizard to create a new bot and retrieve your secret HTTP API token
4. Contact the new bot you just created and click "Start"
5. Search and contact @get_id_bot user
6. Enter anything to retrieve your Chat ID

### Raspberry Pi
1. Download and run [Raspberry Pi Imager](https://www.raspberrypi.com/software/)
2. Install the Lite (32-bit) version to your Micro-SD card
3. Re-insert the Micro-SD card and perform the following:
   3.1. Add this to the bottom of **config.txt**:
   ```
   dtoverlay=dwc2
   dtoverlay=disable-bt
   hdmi_blanking=2
   ```

   3.2. Add this after "rootwait" on **cmdline.txt**:
   ```
   modules-load=dwc2
   ```

   3.3. Add an empty **ssh** file

   3.4. Add **wpa_supplicant.conf** file listing one or more WiFi networks with increasing priority. If I want TeslaBox to prefer my home network, then my USB access point, then my mobile hotspot.
   ```
   ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
   country=US
   update_config=1

   network={
     ssid="my_home_wifi_ssid"
     psk="my_home_wifi_password"
     priority=3
     id_str="home"
   }

   network={
     ssid="my_usb_wifi_ssid"
     psk="my_usb_wifi_password"
     priority=2
     id_str="ap"
   }

   network={
     ssid="my_hotspot_wifi_ssid"
     psk="my_hotspot_wifi_password"
     priority=1
     id_str="hotspot"
   }
   ```
4. Eject the Micro-SD card, insert to your Raspberry Pi and power it up
5. SSH to your Raspberry Pi:
   - IP should be listed on your Router under DHCP table
   - Username is ```pi```
   - Default password is ```raspberry```
6. Change the default password using **passwd** command
7. Perform the following as sudo using ```sudo -i```

   7.1. Allocation of USB storage:
   ```
   size="$(($(df --output=avail / | tail -1) - 12000000))"
   fallocate -l "$size"K /usb.bin
   mkdosfs /usb.bin -F 32 -I
   mkdir /mnt/usb
   echo "/usb.bin /mnt/usb vfat noauto,users,umask=000 0 0" >> /etc/fstab

   touch /etc/modprobe.d/g_mass_storage.conf
   echo "options g_mass_storage file=/usb.bin removable=1 ro=0 stall=0 iSerialNumber=123456" >> /etc/modprobe.d/g_mass_storage.conf
   ```
   * 12000000 is 120GB (~93%) of 128GB card (we want around 8GB of unallocated space)
   * Decrease 12000000 to 5600000 for 64GB card
   * Increase 12000000 to 24800000 for 256GB card
   * Increase 12000000 to 50400000 for 512GB card

   7.2. Allocation of RAM disk:
   ```
   mkdir /mnt/ram
   echo "tmpfs /mnt/ram tmpfs nodev,nosuid,size=4G 0 0" >> /etc/fstab
   ```
   * 4GB (~50%) if you have a Raspberry Pi board with 8GB of ram
   * Decrease 4GB to 2GB if you have a board with 4GB of ram
   * Decrease 4GB to 1GB if you have a board with 2GB of ram

   7.3. Run **raspi-config** to set:
   * Variable fan speed (under "Performance") if you have a 3-wire fan
   * Your timezone (under "Localization")

   7.4. Update system packages, upgrade and install additional software:
   ```
   curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
   apt update && apt upgrade -y
   apt install -y nodejs ffmpeg fonts-freefont-ttf python3-pip
   pip install tesla_dashcam
   ```

   7.5. Download and install TeslaBox and packages:
   ```
   cd /root
   curl -o master.zip https://codeload.github.com/mluggy/teslabox/zip/refs/heads/master
   unzip master.zip
   cd teslabox
   export NPM_CONFIG_UNSAFE_PERM=true
   npm install
   ```

   7.6. Add this after exit of **/etc/rc.local**:
   ```
   /usr/sbin/modprobe g_mass_storage & >> /var/log/app.log 2>&1
   /usr/sbin/fsck -a -y /mnt/usb >> /var/log/app.log 2>&1
   mount /mnt/usb & >> /var/log/app.log 2>&1
   ```

   7.7. Create and edit service variables for this file **/lib/systemd/system/app.service**:
   ```
   [Unit]
   Description=App
   After=network.target

   [Service]
   Environment="NODE_ENV=production"

   # To enable archive, enter these
   Environment="AWS_ACCESS_KEY_ID="
   Environment="AWS_SECRET_ACCESS_KEY="
   Environment="AWS_DEFAULT_REGION="
   Environment="AWS_S3_BUCKET="

   # To enable telegram notification, enter this
   Environment="TELEGRAM_ACCESS_TOKEN="

   # To enable remote access, enter these
   Environment="NGROK_AUTH_TOKEN="
   # Choose the region closest to you (us, eu, ap, au, sa, jp or in)
   Environment="NGROK_REGION=us"

   # For paid Ngrok accounts, enter your custom admin and/or public subdomains
   Environment="ADMIN_HOST="
   Environment="PUBLIC_HOST="

   # To enable remote admin access, enter username and password
   Environment="ADMIN_USER="
   Environment="ADMIN_PASSWORD="

   # To enable remote public (stream-only) access, enter username and password
   Environment="PUBLIC_USER="
   Environment="PUBLIC_PASSWORD="

   Type=simple
   User=root
   ExecStart=/usr/bin/node /root/teslabox/src/index.js
   Restart=on-failure
   RestartSec=5

   [Install]
   WantedBy=multi-user.target
   ```

   7.8. Install the service to start at every boot:
   ```
   systemctl daemon-reload
   systemctl enable app
   systemctl start app
   systemctl status app
   ```
   If the status is Green and shows RUNNING, continue to setup

## Setup

### Local connectivity
For the initial setup, it is best to connect TeslaBox to your home network via ethernet cable or home WiFi, then browse to your device IP address

### In-car connectivity
TeslaBox works best with in-car WiFi. I personally use a 4G USB access point plugged into the main console with a short USB-A (female) to USB-C (male) cable. You can also use your WiFi hotspot, or wait for the car to use your home WiFi while you park.

### Admin access
This works if you entered admin user and password. Most settings are self-explanatory, so I'll focus on the important ones:

- Archive would merge videos of the selected number of seconds into a single clip and upload to S3
- Telegram receipient (your Chat ID) enables notifications from your Telegram created bot
- Stream would show 1-minute delay videos from all angles
- SSH would enable remote SSH access (assuming you also enabled Telegram notifications)
- Public would enable remote public access to stream (assuming you also entered public user and password)

### Public access
This works if you entered public user and password. It will restrict public access to stream view only.

## Usage

### Dashcam
Tesla would recognize the TeslaBox as standard USB. You can click save, honk or use voice commands to capture dashcam clips normaly. Just make sure the TeslaBox is connected properly and the "Record/ing" has a Red dot on the car quick-settings screen.

If archive is enabled, clips will be uploaded to S3 and a copy of each clip (along with the event location) will be sent to your Telegram (assuming you have it set up).

The clip would start X seconds prior to the event ("red dot"). X is settable under *Admin > Archive seconds*.

### Sentry
If archive is enabled and sentry mode is activated, then similarly to dashcam every clip will be uploaded to S3 and/or sent to your Telegram.

The clip would start 10 seconds prior to the event ("red dot") and up to X-10 seconds following the event. X is settable under *Admin > Archive seconds*.

If the event is sensed on the rear, then the back camera is enlarged, otherwise - front. The side cameras are always smaller.

### Stream
This is similar to Tesla's Sentry Mode Live Camera feature but available on any browser. To some extent, you can use it as a public security camera.

There is, however, a 1 minute delay for each clip which is the time it takes to close and prepare the file. You can switch between different angles. Video would automatically progress to the next minute when it is done playing.

If sentry mode is disabled or car is asleep, you might not see any new streams.

This feature is automatically disabled when the car goes to sleep or TeslaBox restarts.

## Support
Please open an issue if things seems out of order. Paid (priority) support is available at teslabox@payymail.com
