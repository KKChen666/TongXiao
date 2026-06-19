# TongXiao Release Folder

This folder contains release tools for the TongXiao project.

## File Description

### 1. build.bat
Frontend build script, features include:
- Check Node.js environment
- Install frontend dependencies
- Build frontend project
- Copy build artifacts to `dist` directory

**Usage:**
```batch
build.bat              # Build frontend
build.bat clean        # Clean build artifacts
```

### 2. release-frontend.bat
Frontend release script, features include:
- Upload frontend build artifacts to server via SSH
- Restart frontend Docker container
- Verify frontend service status

**Usage:**
```batch
release-frontend.bat              # Full release (upload + restart)
release-frontend.bat upload       # Upload only, no restart
release-frontend.bat restart      # Restart only, no upload
```

### 3. release-backend.bat
Backend release script, features include:
- Upload backend code and configuration to server via SSH
- Restart backend Docker container
- Verify backend service status

**Usage:**
```batch
release-backend.bat              # Full release (upload + restart)
release-backend.bat upload       # Upload only, no restart
release-backend.bat restart      # Restart only, no upload
```

### 4. ssh.cmd
SSH connection script, quick connect to server.

**Usage:**
```batch
ssh.cmd                  # Interactive connection
ssh.cmd "docker ps"     # Execute single command
```

### 5. TencentSSHKey.pem
SSH key file for connecting to server.

## Usage Flow

### First Use
1. Ensure `TencentSSHKey.pem` file is in this directory
2. Run `build.bat` to build frontend
3. Run `release-frontend.bat` to release frontend to server
4. Run `release-backend.bat` to release backend to server

### Daily Updates

#### Frontend Updates
1. After modifying frontend code, run `build.bat`
2. Run `release-frontend.bat` to release frontend updates

#### Backend Updates
1. After modifying backend code, run `release-backend.bat`

#### Full Release
1. Run `build.bat` to build frontend
2. Run `release-frontend.bat` to release frontend
3. Run `release-backend.bat` to release backend

## Server Information
- **Server IP:** 119.45.182.166
- **Server User:** root
- **Frontend Port:** 5465
- **Backend Port:** 7896
- **Domain:** good-luck-lct.icu

## Access URLs
- **Frontend:** http://good-luck-lct.icu or http://119.45.182.166:5465
- **Backend API:** http://good-luck-lct.icu/api/ or http://119.45.182.166:7896/api/

## Troubleshooting

### 1. Node.js Not Installed
Download and install Node.js: https://nodejs.org/

### 2. SSH Key File Missing
Ensure `TencentSSHKey.pem` file is in this directory

### 3. SSH Connection Failed
- Check network connection
- Confirm server IP address is correct
- Confirm key file permissions are correct

### 4. Docker Container Startup Failed
Connect to server to view logs:
```batch
ssh.cmd "docker logs tongxiao-backend"
ssh.cmd "docker logs tongxiao-frontend"
```

## Notes
1. Ensure `TencentSSHKey.pem` file permissions are correct (only current user readable)
2. Do not commit `TencentSSHKey.pem` file to version control system
3. Ensure frontend code is saved before building
4. Ensure server Docker service is running before releasing