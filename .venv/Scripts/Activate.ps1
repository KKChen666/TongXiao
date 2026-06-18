<#
.Synopsis
Activate a Python virtual environment for the current PowerShell session.

.Description
Pushes the python executable for a virtual environment to the front of the
$Env:PATH environment variable and sets the prompt to signify that you are
in a Python virtual environment. Makes use of the command line switches as
well as the `pyvenv.cfg` file values present in the virtual environment.

.Parameter VenvDir
Path to the directory that contains the virtual environment to activate. The
default value for this is the parent of the directory that the Activate.ps1
script is located within.

.Parameter Prompt
The prompt prefix to display when this virtual environment is activated. By
default, this prompt is the name of the virtual environment folder (VenvDir)
surrounded by parentheses and followed by a single space (ie. '(.venv) ').

.Example
Activate.ps1
Activates the Python virtual environment that contains the Activate.ps1 script.

.Example
Activate.ps1 -Verbose
Activates the Python virtual environment that contains the Activate.ps1 script,
and shows extra information about the activation as it executes.

.Example
Activate.ps1 -VenvDir C:\Users\MyUser\Common\.venv
Activates the Python virtual environment located in the specified location.

.Example
Activate.ps1 -Prompt "MyPython"
Activates the Python virtual environment that contains the Activate.ps1 script,
and prefixes the current prompt with the specified string (surrounded in
parentheses) while the virtual environment is active.

.Notes
On Windows, it may be required to enable this Activate.ps1 script by setting the
execution policy for the user. You can do this by issuing the following PowerShell
command:

PS C:\> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

For more information on Execution Policies: 
https://go.microsoft.com/fwlink/?LinkID=135170

#>
Param(
    [Parameter(Mandatory = $false)]
    [String]
    $VenvDir,
    [Parameter(Mandatory = $false)]
    [String]
    $Prompt
)

<# Function declarations --------------------------------------------------- #>

<#
.Synopsis
Remove all shell session elements added by the Activate script, including the
addition of the virtual environment's Python executable from the beginning of
the PATH variable.

.Parameter NonDestructive
If present, do not remove this function from the global namespace for the
session.

#>
function global:deactivate ([switch]$NonDestructive) {
    # Revert to original values

    # The prior prompt:
    if (Test-Path -Path Function:_OLD_VIRTUAL_PROMPT) {
        Copy-Item -Path Function:_OLD_VIRTUAL_PROMPT -Destination Function:prompt
        Remove-Item -Path Function:_OLD_VIRTUAL_PROMPT
    }

    # The prior PYTHONHOME:
    if (Test-Path -Path Env:_OLD_VIRTUAL_PYTHONHOME) {
        Copy-Item -Path Env:_OLD_VIRTUAL_PYTHONHOME -Destination Env:PYTHONHOME
        Remove-Item -Path Env:_OLD_VIRTUAL_PYTHONHOME
    }

    # The prior PATH:
    if (Test-Path -Path Env:_OLD_VIRTUAL_PATH) {
        Copy-Item -Path Env:_OLD_VIRTUAL_PATH -Destination Env:PATH
        Remove-Item -Path Env:_OLD_VIRTUAL_PATH
    }

    # Just remove the VIRTUAL_ENV altogether:
    if (Test-Path -Path Env:VIRTUAL_ENV) {
        Remove-Item -Path env:VIRTUAL_ENV
    }

    # Just remove VIRTUAL_ENV_PROMPT altogether.
    if (Test-Path -Path Env:VIRTUAL_ENV_PROMPT) {
        Remove-Item -Path env:VIRTUAL_ENV_PROMPT
    }

    # Just remove the _PYTHON_VENV_PROMPT_PREFIX altogether:
    if (Get-Variable -Name "_PYTHON_VENV_PROMPT_PREFIX" -ErrorAction SilentlyContinue) {
        Remove-Variable -Name _PYTHON_VENV_PROMPT_PREFIX -Scope Global -Force
    }

    # Leave deactivate function in the global namespace if requested:
    if (-not $NonDestructive) {
        Remove-Item -Path function:deactivate
    }
}

<#
.Description
Get-PyVenvConfig parses the values from the pyvenv.cfg file located in the
given folder, and returns them in a map.

For each line in the pyvenv.cfg file, if that line can be parsed into exactly
two strings separated by `=` (with any amount of whitespace surrounding the =)
then it is considered a `key = value` line. The left hand string is the key,
the right hand is the value.

If the value starts with a `'` or a `"` then the first and last character is
stripped from the value before being captured.

.Parameter ConfigDir
Path to the directory that contains the `pyvenv.cfg` file.
#>
function Get-PyVenvConfig(
    [String]
    $ConfigDir
) {
    Write-Verbose "Given ConfigDir=$ConfigDir, obtain values in pyvenv.cfg"

    # Ensure the file exists, and issue a warning if it doesn't (but still allow the function to continue).
    $pyvenvConfigPath = Join-Path -Resolve -Path $ConfigDir -ChildPath 'pyvenv.cfg' -ErrorAction Continue

    # An empty map will be returned if no config file is found.
    $pyvenvConfig = @{ }

    if ($pyvenvConfigPath) {

        Write-Verbose "File exists, parse `key = value` lines"
        $pyvenvConfigContent = Get-Content -Path $pyvenvConfigPath

        $pyvenvConfigContent | ForEach-Object {
            $keyval = $PSItem -split "\s*=\s*", 2
            if ($keyval[0] -and $keyval[1]) {
                $val = $keyval[1]

                # Remove extraneous quotations around a string value.
                if ("'""".Contains($val.Substring(0, 1))) {
                    $val = $val.Substring(1, $val.Length - 2)
                }

                $pyvenvConfig[$keyval[0]] = $val
                Write-Verbose "Adding Key: '$($keyval[0])'='$val'"
            }
        }
    }
    return $pyvenvConfig
}


<# Begin Activate script --------------------------------------------------- #>

# Determine the containing directory of this script
$VenvExecPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
$VenvExecDir = Get-Item -Path $VenvExecPath

Write-Verbose "Activation script is located in path: '$VenvExecPath'"
Write-Verbose "VenvExecDir Fullname: '$($VenvExecDir.FullName)"
Write-Verbose "VenvExecDir Name: '$($VenvExecDir.Name)"

# Set values required in priority: CmdLine, ConfigFile, Default
# First, get the location of the virtual environment, it might not be
# VenvExecDir if specified on the command line.
if ($VenvDir) {
    Write-Verbose "VenvDir given as parameter, using '$VenvDir' to determine values"
}
else {
    Write-Verbose "VenvDir not given as a parameter, using parent directory name as VenvDir."
    $VenvDir = $VenvExecDir.Parent.FullName.TrimEnd("\\/")
    Write-Verbose "VenvDir=$VenvDir"
}

# Next, read the `pyvenv.cfg` file to determine any required value such
# as `prompt`.
$pyvenvCfg = Get-PyVenvConfig -ConfigDir $VenvDir

# Next, set the prompt from the command line, or the config file, or
# just use the name of the virtual environment folder.
if ($Prompt) {
    Write-Verbose "Prompt specified as argument, using '$Prompt'"
}
else {
    Write-Verbose "Prompt not specified as argument to script, checking pyvenv.cfg value"
    if ($pyvenvCfg -and $pyvenvCfg['prompt']) {
        Write-Verbose "  Setting based on value in pyvenv.cfg='$($pyvenvCfg['prompt'])'"
        $Prompt = $pyvenvCfg['prompt'];
    }
    else {
        Write-Verbose "  Setting prompt based on parent's directory's name. (Is the directory name passed to venv module when creating the virtual environment)"
        Write-Verbose "  Got leaf-name of $VenvDir='$(Split-Path -Path $venvDir -Leaf)'"
        $Prompt = Split-Path -Path $venvDir -Leaf
    }
}

Write-Verbose "Prompt = '$Prompt'"
Write-Verbose "VenvDir='$VenvDir'"

# Deactivate any currently active virtual environment, but leave the
# deactivate function in place.
deactivate -nondestructive

# Now set the environment variable VIRTUAL_ENV, used by many tools to determine
# that there is an activated venv.
$env:VIRTUAL_ENV = $VenvDir

$env:VIRTUAL_ENV_PROMPT = $Prompt

if (-not $Env:VIRTUAL_ENV_DISABLE_PROMPT) {

    Write-Verbose "Setting prompt to '$Prompt'"

    # Set the prompt to include the env name
    # Make sure _OLD_VIRTUAL_PROMPT is global
    function global:_OLD_VIRTUAL_PROMPT { "" }
    Copy-Item -Path function:prompt -Destination function:_OLD_VIRTUAL_PROMPT
    New-Variable -Name _PYTHON_VENV_PROMPT_PREFIX -Description "Python virtual environment prompt prefix" -Scope Global -Option ReadOnly -Visibility Public -Value $Prompt

    function global:prompt {
        Write-Host -NoNewline -ForegroundColor Green "($_PYTHON_VENV_PROMPT_PREFIX) "
        _OLD_VIRTUAL_PROMPT
    }
}

# Clear PYTHONHOME
if (Test-Path -Path Env:PYTHONHOME) {
    Copy-Item -Path Env:PYTHONHOME -Destination Env:_OLD_VIRTUAL_PYTHONHOME
    Remove-Item -Path Env:PYTHONHOME
}

# Add the venv to the PATH
Copy-Item -Path Env:PATH -Destination Env:_OLD_VIRTUAL_PATH
$Env:PATH = "$VenvExecDir$([System.IO.Path]::PathSeparator)$Env:PATH"

# SIG # Begin signature block
# MII28gYJKoZIhvcNAQcCoII24zCCNt8CAQExDzANBglghkgBZQMEAgEFADB5Bgor
# BgEEAYI3AgEEoGswaTA0BgorBgEEAYI3AgEeMCYCAwEAAAQQH8w7YFlLCE63JNLG
# KX7zUQIBAAIBAAIBAAIBAAIBADAxMA0GCWCGSAFlAwQCAQUABCBALKwKRFIhr2RY
# IW/WJLd9pc8a9sj/IoThKU92fTfKsKCCG1wwggXMMIIDtKADAgECAhBUmNLR1FsZ
# lUgTecgRwIeZMA0GCSqGSIb3DQEBDAUAMHcxCzAJBgNVBAYTAlVTMR4wHAYDVQQK
# ExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xSDBGBgNVBAMTP01pY3Jvc29mdCBJZGVu
# dGl0eSBWZXJpZmljYXRpb24gUm9vdCBDZXJ0aWZpY2F0ZSBBdXRob3JpdHkgMjAy
# MDAeFw0yMDA0MTYxODM2MTZaFw00NTA0MTYxODQ0NDBaMHcxCzAJBgNVBAYTAlVT
# MR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xSDBGBgNVBAMTP01pY3Jv
# c29mdCBJZGVudGl0eSBWZXJpZmljYXRpb24gUm9vdCBDZXJ0aWZpY2F0ZSBBdXRo
# b3JpdHkgMjAyMDCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBALORKgeD
# Bmf9np3gx8C3pOZCBH8Ppttf+9Va10Wg+3cL8IDzpm1aTXlT2KCGhFdFIMeiVPvH
# or+Kx24186IVxC9O40qFlkkN/76Z2BT2vCcH7kKbK/ULkgbk/WkTZaiRcvKYhOuD
# PQ7k13ESSCHLDe32R0m3m/nJxxe2hE//uKya13NnSYXjhr03QNAlhtTetcJtYmrV
# qXi8LW9J+eVsFBT9FMfTZRY33stuvF4pjf1imxUs1gXmuYkyM6Nix9fWUmcIxC70
# ViueC4fM7Ke0pqrrBc0ZV6U6CwQnHJFnni1iLS8evtrAIMsEGcoz+4m+mOJyoHI1
# vnnhnINv5G0Xb5DzPQCGdTiO0OBJmrvb0/gwytVXiGhNctO/bX9x2P29Da6SZEi3
# W295JrXNm5UhhNHvDzI9e1eM80UHTHzgXhgONXaLbZ7LNnSrBfjgc10yVpRnlyUK
# xjU9lJfnwUSLgP3B+PR0GeUw9gb7IVc+BhyLaxWGJ0l7gpPKWeh1R+g/OPTHU3mg
# trTiXFHvvV84wRPmeAyVWi7FQFkozA8kwOy6CXcjmTimthzax7ogttc32H83rwjj
# O3HbbnMbfZlysOSGM1l0tRYAe1BtxoYT2v3EOYI9JACaYNq6lMAFUSw0rFCZE4e7
# swWAsk0wAly4JoNdtGNz764jlU9gKL431VulAgMBAAGjVDBSMA4GA1UdDwEB/wQE
# AwIBhjAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTIftJqhSobyhmYBAcnz1AQ
# T2ioojAQBgkrBgEEAYI3FQEEAwIBADANBgkqhkiG9w0BAQwFAAOCAgEAr2rd5hnn
# LZRDGU7L6VCVZKUDkQKL4jaAOxWiUsIWGbZqWl10QzD0m/9gdAmxIR6QFm3FJI9c
# Zohj9E/MffISTEAQiwGf2qnIrvKVG8+dBetJPnSgaFvlVixlHIJ+U9pW2UYXeZJF
# xBA2CFIpF8svpvJ+1Gkkih6PsHMNzBxKq7Kq7aeRYwFkIqgyuH4yKLNncy2RtNwx
# AQv3Rwqm8ddK7VZgxCwIo3tAsLx0J1KH1r6I3TeKiW5niB31yV2g/rarOoDXGpc8
# FzYiQR6sTdWD5jw4vU8w6VSp07YEwzJ2YbuwGMUrGLPAgNW3lbBeUU0i/OxYqujY
# lLSlLu2S3ucYfCFX3VVj979tzR/SpncocMfiWzpbCNJbTsgAlrPhgzavhgplXHT2
# 6ux6anSg8Evu75SjrFDyh+3XOjCDyft9V77l4/hByuVkrrOj7FjshZrM77nq81YY
# uVxzmq/FdxeDWds3GhhyVKVB0rYjdaNDmuV3fJZ5t0GNv+zcgKCf0Xd1WF81E+Al
# GmcLfc4l+gcK5GEh2NQc5QfGNpn0ltDGFf5Ozdeui53bFv0ExpK91IjmqaOqu/dk
# ODtfzAzQNb50GQOmxapMomE2gj4d8yu8l13bS3g7LfU772Aj6PXsCyM2la+YZr9T
# 03u4aUoqlmZpxJTG9F9urJh4iIAGXKKy7aIwgga6MIIEoqADAgECAhMzAAC6whhV
# vP1IDtsKAAAAALrCMA0GCSqGSIb3DQEBDAUAMFoxCzAJBgNVBAYTAlVTMR4wHAYD
# VQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xKzApBgNVBAMTIk1pY3Jvc29mdCBJ
# RCBWZXJpZmllZCBDUyBBT0MgQ0EgMDQwHhcNMjYwNTA0MDcyNzI3WhcNMjYwNTA3
# MDcyNzI3WjB8MQswCQYDVQQGEwJVUzEPMA0GA1UECBMGT3JlZ29uMRIwEAYDVQQH
# EwlCZWF2ZXJ0b24xIzAhBgNVBAoTGlB5dGhvbiBTb2Z0d2FyZSBGb3VuZGF0aW9u
# MSMwIQYDVQQDExpQeXRob24gU29mdHdhcmUgRm91bmRhdGlvbjCCAaIwDQYJKoZI
# hvcNAQEBBQADggGPADCCAYoCggGBAIk4UYyoaGlDXTBhW5K+xt2cdERKghHuOc8N
# 9dk3lBJkTOCGqwwjNp3nviFbHxhYlvn39v9lBTm5RQAuXQz27dgAnEZCdA/7bQr7
# VoO8LQwOcs66s3x7e+Z2xfVjLRDlERVOv7tpQhWUpc0Lu325fUTUJvAyzRyngMWZ
# RN+WxSqzehcPRjqd3zBzFkTrn0UJYe3lcFjT/05l/Sm9Tj0m+vW4P8/pKC4K5bNa
# c9gHFfQ2gM/kH2ks9/2Hf+Rjp3MW2hBjIt2YkgictYsZbBmcnLTGgUWqbjwD2znR
# Y6yXms9fzkd4XugMcGoYSN0OQr88CBjIJVl3xsAYhIzvJXPO3Eo6vyrKtpaQ6tdq
# EjcnsTzKu5TudGc3xClAE2ExrI/7GizH1o070hWFablSSvbheIlr9PCsPpNPoLur
# gOXV1s6/GYjKMxyPQKp0E0W7bJJMNyPnBZJyNrD2ovL3Fqdtvh+q6OBUafAnLrvW
# N+BQPzbym5Z7fL4LnRnh8sg+d6sDnwIDAQABo4IB1TCCAdEwDAYDVR0TAQH/BAIw
# ADAOBgNVHQ8BAf8EBAMCB4AwPAYDVR0lBDUwMwYKKwYBBAGCN2EBAAYIKwYBBQUH
# AwMGGysGAQQBgjdhgqKNuwqmkohkgZH0oEWCk/3hbzAdBgNVHQ4EFgQUaWSX1vZs
# hX08KMbjgzML4PsW6BYwHwYDVR0jBBgwFoAUayVB3vtrfP0YgAotf492XapzPbgw
# ZwYDVR0fBGAwXjBcoFqgWIZWaHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9w
# cy9jcmwvTWljcm9zb2Z0JTIwSUQlMjBWZXJpZmllZCUyMENTJTIwQU9DJTIwQ0El
# MjAwNC5jcmwwdAYIKwYBBQUHAQEEaDBmMGQGCCsGAQUFBzAChlhodHRwOi8vd3d3
# Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRzL01pY3Jvc29mdCUyMElEJTIwVmVy
# aWZpZWQlMjBDUyUyMEFPQyUyMENBJTIwMDQuY3J0MFQGA1UdIARNMEswSQYEVR0g
# ADBBMD8GCCsGAQUFBwIBFjNodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3Bz
# L0RvY3MvUmVwb3NpdG9yeS5odG0wDQYJKoZIhvcNAQEMBQADggIBADThQFYfl89O
# Idia1DOG+QPjvDp4vhrZC2DA6New32fznMWRlPFUYAinTLm3hh+vPFDv6CNTPQlw
# R3fw8cAKqYPBTq1ZZoug+fgAjOq9UTxYeoVWFjF033lSsmfwlrOgoHh0R3jNL/iH
# TCp4M0vLS7SrHnOijEZg2og/VF1ohdLEecqgQuP313+HIZxZaAnBP32ixvDAzgKd
# jE1Hc0YkBl9F9dKNZkPkjLdUXqZfRu+QnvemIzxEOYCDogot8NSONpt+5zt/Z7R+
# anwWoMN0zp2kPR6iMYBEj/9SZ+WNCJim2rvIyRki3sYx4KK/14PJtYjrBQJ4YA3n
# 1n4sWYcsFxiNYnn1inKXMTsIvtDa+3U3LbxORwO5DTgP8lqjvROyoDUiI6geVOFV
# vxABt5YGlF/Um/1Qszdqceo31ac8lEAQrezmv9R4NB/ysr9ya/GFG3RGcG3PQi7k
# okLEHmobI3vnRcxfYTwxNLPFf0PmEfqS6VpjnUeXvZel56SEIrdHzY0taG19+syk
# 2LaGT81hbRSDUznA44gSO5EdVWgGmaDxGJUcuhEuRZ7cGTgoocqM9DUAwHC+j4gG
# Z/xAAqO86sI17WnJ8KzuKgJhi/Q8QTcgy2fHQyXSy9cwn22Qt3fzce7U20nKJ4fn
# R+zjo33cWEwt9H5F1puUK9PcS0ZQOyRtMIIHKDCCBRCgAwIBAgITMwAAABYxko2S
# AmV7mgAAAAAAFjANBgkqhkiG9w0BAQwFADBjMQswCQYDVQQGEwJVUzEeMBwGA1UE
# ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMTQwMgYDVQQDEytNaWNyb3NvZnQgSUQg
# VmVyaWZpZWQgQ29kZSBTaWduaW5nIFBDQSAyMDIxMB4XDTI2MDMyNjE4MTEyOVoX
# DTMxMDMyNjE4MTEyOVowWjELMAkGA1UEBhMCVVMxHjAcBgNVBAoTFU1pY3Jvc29m
# dCBDb3Jwb3JhdGlvbjErMCkGA1UEAxMiTWljcm9zb2Z0IElEIFZlcmlmaWVkIENT
# IEFPQyBDQSAwNDCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAMpV+sjb
# 6Akwz/RtDk5Uo1284BLMttRQy9e5/5WXtga6h89pkdWjeAwcXmKdP4YxKkhx8hn2
# q1dTVQbryvLy81tC04vg2bfSJ9emojX4HKIBYs7VhPRafMbtc866hN55aw1m/kWa
# PEKxF4Fm/LPLMLJdlu7URB8nFZMfh5tTC0CJb2uox/14OP/BiGIR8214lXdkV6Js
# PbO0Iev0mEV133tducIeBChMipzTZfnGVEq1QYFr7460cEGOIn+7AGfNOSq7gWOl
# mNB4m2uZ1r66vUJPaN+VYgH/Kmfu7tX229b3Alsli38fYS0nQY41bElntMS7yNY+
# Kd047eXM8/tS3NL+ZUNX3ge5xZqW2aytrrNIbwGgQnzsgzxBJvu9+b87jUWFiRS/
# z1YiPkRLY7iTHKIxJ973kIyK8K5itE/aEq/Ht6A8ytaAMMGTEwuCspk72FE1Qyby
# +TfDlv1KiAc7IlWHHIWbxoVd8jGCoMXhLSDhuFuGfOWOZKUIuW6YxlxcUYOOkXa0
# 2gC7dUYUZi0e1NI1Uq9mmAHdvjKdqgORs9/5aDjnbeO3hWd5qwGBmELWytkjY0Kc
# IEF+CMurTimoQoBYSiHJbYrb0pKSQe+3lVoTVpzdi36jKI7MxLnu1fBAMksa8uD8
# 5cU7RU29zMOd18h9dgTEH9pvY+4xLB3lUgE7AgMBAAGjggHcMIIB2DAOBgNVHQ8B
# Af8EBAMCAYYwEAYJKwYBBAGCNxUBBAMCAQAwHQYDVR0OBBYEFGslQd77a3z9GIAK
# LX+Pdl2qcz24MFQGA1UdIARNMEswSQYEVR0gADBBMD8GCCsGAQUFBwIBFjNodHRw
# Oi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL0RvY3MvUmVwb3NpdG9yeS5odG0w
# GQYJKwYBBAGCNxQCBAweCgBTAHUAYgBDAEEwEgYDVR0TAQH/BAgwBgEB/wIBADAf
# BgNVHSMEGDAWgBTZQSmwDw9jbO9p1/XNKZ6kSGow5jBwBgNVHR8EaTBnMGWgY6Bh
# hl9odHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQl
# MjBJRCUyMFZlcmlmaWVkJTIwQ29kZSUyMFNpZ25pbmclMjBQQ0ElMjAyMDIxLmNy
# bDB9BggrBgEFBQcBAQRxMG8wbQYIKwYBBQUHMAKGYWh0dHA6Ly93d3cubWljcm9z
# b2Z0LmNvbS9wa2lvcHMvY2VydHMvTWljcm9zb2Z0JTIwSUQlMjBWZXJpZmllZCUy
# MENvZGUlMjBTaWduaW5nJTIwUENBJTIwMjAyMS5jcnQwDQYJKoZIhvcNAQEMBQAD
# ggIBAAbVUF5UdNVEGWOVxkPciIzHA/IyNDIs1oSdW7mY4ObaFEEl8fwawEsBOasc
# BzwXjuOaTkKelQ+IiC4JvDpn8pWPgOyiKrbbw1Iswt7AV8YyuLu7A0YshILlxyny
# 9R0AMMQixLZ0T5Aj07CQOm/de5QPt36ECBwtVww6XUCx8Rm2xl6eEa9JhSub8W4u
# rQGoQYv0Zczlz4ej2ryj5Wf9L4ZZA3bL6CRE7XmzSQjTmdSmr904PiuL2uBWzq2K
# kR3RhmoaAP4Jk2JplasNM5Bs0+dx3YX2o6xRrbSaJiu6hPk/AkBoj5BCJMTZkl4w
# k6Q6nOFNSCpUxnBmJ0RRkoKq51p5ADTxbCeRAx8rIfNpTyPjxQtxTiFTC8yy/t9K
# 6s570YB1FAI+8XxZxIrmgMd7xVUkzi2/oooKb3UeovH0lqYGBEjpHZJ9jee7boQb
# Oe7SsKD/vr3PzFabg9VwLZlovpWUpWoWnU2w3xiozJ/m35tsZVvT2egUpwkb9TDI
# aXFGZAGV94FRDHn/K2XNnOwSeGskX19MB+N7yPc51fmUSd49MVAtGW/NkUGpRech
# 5Aq/d8dCML2bZ+j9nTUMgj+qnd3wuEZVRbQEIbTh9HAck0fyKqoIb+qh8y/6TKbY
# DEEOcfM2BGMvrQk4WIGCK6u8uFhA2EH3kpaiMUDqyFCeCCQxMIIHnjCCBYagAwIB
# AgITMwAAAAeHozSje6WOHAAAAAAABzANBgkqhkiG9w0BAQwFADB3MQswCQYDVQQG
# EwJVUzEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMUgwRgYDVQQDEz9N
# aWNyb3NvZnQgSWRlbnRpdHkgVmVyaWZpY2F0aW9uIFJvb3QgQ2VydGlmaWNhdGUg
# QXV0aG9yaXR5IDIwMjAwHhcNMjEwNDAxMjAwNTIwWhcNMzYwNDAxMjAxNTIwWjBj
# MQswCQYDVQQGEwJVUzEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMTQw
# MgYDVQQDEytNaWNyb3NvZnQgSUQgVmVyaWZpZWQgQ29kZSBTaWduaW5nIFBDQSAy
# MDIxMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAsvDArxmIKOLdVHpM
# SWxpCFUJtFL/ekr4weslKPdnF3cpTeuV8veqtmKVgok2rO0D05BpyvUDCg1wdsoE
# tuxACEGcgHfjPF/nZsOkg7c0mV8hpMT/GvB4uhDvWXMIeQPsDgCzUGzTvoi76YDp
# xDOxhgf8JuXWJzBDoLrmtThX01CE1TCCvH2sZD/+Hz3RDwl2MsvDSdX5rJDYVuR3
# bjaj2QfzZFmwfccTKqMAHlrz4B7ac8g9zyxlTpkTuJGtFnLBGasoOnn5NyYlf0xF
# 9/bjVRo4Gzg2Yc7KR7yhTVNiuTGH5h4eB9ajm1OCShIyhrKqgOkc4smz6obxO+Hx
# KeJ9bYmPf6KLXVNLz8UaeARo0BatvJ82sLr2gqlFBdj1sYfqOf00Qm/3B4XGFPDK
# /H04kteZEZsBRc3VT2d/iVd7OTLpSH9yCORV3oIZQB/Qr4nD4YT/lWkhVtw2v2s0
# TnRJubL/hFMIQa86rcaGMhNsJrhysLNNMeBhiMezU1s5zpusf54qlYu2v5sZ5zL0
# KvBDLHtL8F9gn6jOy3v7Jm0bbBHjrW5yQW7S36ALAt03QDpwW1JG1Hxu/FUXJbBO
# 2AwwVG4Fre+ZQ5Od8ouwt59FpBxVOBGfN4vN2m3fZx1gqn52GvaiBz6ozorgIEjn
# +PhUXILhAV5Q/ZgCJ0u2+ldFGjcCAwEAAaOCAjUwggIxMA4GA1UdDwEB/wQEAwIB
# hjAQBgkrBgEEAYI3FQEEAwIBADAdBgNVHQ4EFgQU2UEpsA8PY2zvadf1zSmepEhq
# MOYwVAYDVR0gBE0wSzBJBgRVHSAAMEEwPwYIKwYBBQUHAgEWM2h0dHA6Ly93d3cu
# bWljcm9zb2Z0LmNvbS9wa2lvcHMvRG9jcy9SZXBvc2l0b3J5Lmh0bTAZBgkrBgEE
# AYI3FAIEDB4KAFMAdQBiAEMAQTAPBgNVHRMBAf8EBTADAQH/MB8GA1UdIwQYMBaA
# FMh+0mqFKhvKGZgEByfPUBBPaKiiMIGEBgNVHR8EfTB7MHmgd6B1hnNodHRwOi8v
# d3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NybC9NaWNyb3NvZnQlMjBJZGVudGl0
# eSUyMFZlcmlmaWNhdGlvbiUyMFJvb3QlMjBDZXJ0aWZpY2F0ZSUyMEF1dGhvcml0
# eSUyMDIwMjAuY3JsMIHDBggrBgEFBQcBAQSBtjCBszCBgQYIKwYBBQUHMAKGdWh0
# dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvY2VydHMvTWljcm9zb2Z0JTIw
# SWRlbnRpdHklMjBWZXJpZmljYXRpb24lMjBSb290JTIwQ2VydGlmaWNhdGUlMjBB
# dXRob3JpdHklMjAyMDIwLmNydDAtBggrBgEFBQcwAYYhaHR0cDovL29uZW9jc3Au
# bWljcm9zb2Z0LmNvbS9vY3NwMA0GCSqGSIb3DQEBDAUAA4ICAQB/JSqe/tSr6t1m
# CttXI0y6XmyQ41uGWzl9xw+WYhvOL47BV09Dgfnm/tU4ieeZ7NAR5bguorTCNr58
# HOcA1tcsHQqt0wJsdClsu8bpQD9e/al+lUgTUJEV80Xhco7xdgRrehbyhUf4pkeA
# hBEjABvIUpD2LKPho5Z4DPCT5/0TlK02nlPwUbv9URREhVYCtsDM+31OFU3fDV8B
# mQXv5hT2RurVsJHZgP4y26dJDVF+3pcbtvh7R6NEDuYHYihfmE2HdQRq5jRvLE1E
# b59PYwISFCX2DaLZ+zpU4bX0I16ntKq4poGOFaaKtjIA1vRElItaOKcwtc04CBrX
# SfyL2Op6mvNIxTk4OaswIkTXbFL81ZKGD+24uMCwo/pLNhn7VHLfnxlMVzHQVL+b
# Ha9KhTyzwdG/L6uderJQn0cGpLQMStUuNDArxW2wF16QGZ1NtBWgKA8Kqv48M8Hf
# FqNifN6+zt6J0GwzvU8g0rYGgTZR8zDEIJfeZxwWDHpSxB5FJ1VVU1LIAtB7o9PX
# bjXzGifaIMYTzU4YKt4vMNwwBmetQDHhdAtTPplOXrnI9SI6HeTtjDD3iUN/7ygb
# ahmYOHk7VB7fwT4ze+ErCbMh6gHV1UuXPiLciloNxH6K4aMfZN1oLVk6YFeIJEok
# uPgNPa6EnTiOL60cPqfny+Fq8UiuZzGCGuwwghroAgEBMHEwWjELMAkGA1UEBhMC
# VVMxHjAcBgNVBAoTFU1pY3Jvc29mdCBDb3Jwb3JhdGlvbjErMCkGA1UEAxMiTWlj
# cm9zb2Z0IElEIFZlcmlmaWVkIENTIEFPQyBDQSAwNAITMwAAusIYVbz9SA7bCgAA
# AAC6wjANBglghkgBZQMEAgEFAKCBuDAZBgkqhkiG9w0BCQMxDAYKKwYBBAGCNwIB
# BDAcBgorBgEEAYI3AgELMQ4wDAYKKwYBBAGCNwIBFTAvBgkqhkiG9w0BCQQxIgQg
# Kld7dFLdvZygPQIm94QeWCWq09RhnYWpKs5R8/oLpjgwTAYKKwYBBAGCNwIBDDE+
# MDygNoA0AFAAeQB0AGgAbwBuACAAMwAuADEANAAuADUAcgBjADEAIAAoAGEANgA4
# AGEAOQAxADkAKaECgAAwDQYJKoZIhvcNAQEBBQAEggGADpunjG5Mc6Bt19EeKFzG
# 7ky4oYVWwA68DJmfMYkEstJmdD+qpGDLXnp6C8yzzPopKl6CZpEp6wTubm8Vk9LL
# J50tDKHLqVJH0DuOpDG4n0FxUc+hGrwIQWgH6ZwzbBPLXf45zChPPDNawM1b1TyI
# sa+PLIMB4t7zjfy08Uc/Hvojl3cfKePBc9xzXrZYyEoYKhlr1Vu1Z1Wdjr5+yHD1
# UfnJsha6pDF1afZYlB3c6UsBsHwdeyiXAUaI1vqgPZmeemfHFVwY2Tt5LOwFA4lX
# jFyuXuT5Y6zLzm84WUSy6OMfEzg8SM52Hes6AjLRupXnyNb9b2ZFKBA1CoknA0hM
# p5BpSmAKSuKvKbjZOtSFxtElxXYZfIOaI88eYsK+KRRGGSdRLYhVm7EiJJcZ4964
# 74GohV+hjeLncXijMe7QcHhkQJobtKh0TZftAHSNwY3SnVH+NSZXIYb+k2JeteT6
# 7AV1FRRfZIkJx4LBAyUZ8WNefOX8V44TS/zGJBlp6qftoYIYETCCGA0GCisGAQQB
# gjcDAwExghf9MIIX+QYJKoZIhvcNAQcCoIIX6jCCF+YCAQMxDzANBglghkgBZQME
# AgEFADCCAWIGCyqGSIb3DQEJEAEEoIIBUQSCAU0wggFJAgEBBgorBgEEAYRZCgMB
# MDEwDQYJYIZIAWUDBAIBBQAEILy9oNcn2kDlBxg3oFgSG0hNQU0AwRiWNsDCCkzP
# 67uJAgZp6IEHqX8YEzIwMjYwNTA0MTY1NDI4LjY4NVowBIACAfSggeGkgd4wgdsx
# CzAJBgNVBAYTAlVTMRMwEQYDVQQIEwpXYXNoaW5ndG9uMRAwDgYDVQQHEwdSZWRt
# b25kMR4wHAYDVQQKExVNaWNyb3NvZnQgQ29ycG9yYXRpb24xJTAjBgNVBAsTHE1p
# Y3Jvc29mdCBBbWVyaWNhIE9wZXJhdGlvbnMxJzAlBgNVBAsTHm5TaGllbGQgVFNT
# IEVTTjo3RDAwLTA1RTAtRDk0NzE1MDMGA1UEAxMsTWljcm9zb2Z0IFB1YmxpYyBS
# U0EgVGltZSBTdGFtcGluZyBBdXRob3JpdHmggg8hMIIHgjCCBWqgAwIBAgITMwAA
# AAXlzw//Zi7JhwAAAAAABTANBgkqhkiG9w0BAQwFADB3MQswCQYDVQQGEwJVUzEe
# MBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMUgwRgYDVQQDEz9NaWNyb3Nv
# ZnQgSWRlbnRpdHkgVmVyaWZpY2F0aW9uIFJvb3QgQ2VydGlmaWNhdGUgQXV0aG9y
# aXR5IDIwMjAwHhcNMjAxMTE5MjAzMjMxWhcNMzUxMTE5MjA0MjMxWjBhMQswCQYD
# VQQGEwJVUzEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQD
# EylNaWNyb3NvZnQgUHVibGljIFJTQSBUaW1lc3RhbXBpbmcgQ0EgMjAyMDCCAiIw
# DQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAJ5851Jj/eDFnwV9Y7UGIqMcHtfn
# lzPREwW9ZUZHd5HBXXBvf7KrQ5cMSqFSHGqg2/qJhYqOQxwuEQXG8kB41wsDJP5d
# 0zmLYKAY8Zxv3lYkuLDsfMuIEqvGYOPURAH+Ybl4SJEESnt0MbPEoKdNihwM5xGv
# 0rGofJ1qOYSTNcc55EbBT7uq3wx3mXhtVmtcCEr5ZKTkKKE1CxZvNPWdGWJUPC6e
# 4uRfWHIhZcgCsJ+sozf5EeH5KrlFnxpjKKTavwfFP6XaGZGWUG8TZaiTogRoAlqc
# evbiqioUz1Yt4FRK53P6ovnUfANjIgM9JDdJ4e0qiDRm5sOTiEQtBLGd9Vhd1Mad
# xoGcHrRCsS5rO9yhv2fjJHrmlQ0EIXmp4DhDBieKUGR+eZ4CNE3ctW4uvSDQVeSp
# 9h1SaPV8UWEfyTxgGjOsRpeexIveR1MPTVf7gt8hY64XNPO6iyUGsEgt8c2PxF87
# E+CO7A28TpjNq5eLiiunhKbq0XbjkNoU5JhtYUrlmAbpxRjb9tSreDdtACpm3rkp
# xp7AQndnI0Shu/fk1/rE3oWsDqMX3jjv40e8KN5YsJBnczyWB4JyeeFMW3JBfdeA
# KhzohFe8U5w9WuvcP1E8cIxLoKSDzCCBOu0hWdjzKNu8Y5SwB1lt5dQhABYyzR3d
# xEO/T1K/BVF3rV69AgMBAAGjggIbMIICFzAOBgNVHQ8BAf8EBAMCAYYwEAYJKwYB
# BAGCNxUBBAMCAQAwHQYDVR0OBBYEFGtpKDo1L0hjQM972K9J6T7ZPdshMFQGA1Ud
# IARNMEswSQYEVR0gADBBMD8GCCsGAQUFBwIBFjNodHRwOi8vd3d3Lm1pY3Jvc29m
# dC5jb20vcGtpb3BzL0RvY3MvUmVwb3NpdG9yeS5odG0wEwYDVR0lBAwwCgYIKwYB
# BQUHAwgwGQYJKwYBBAGCNxQCBAweCgBTAHUAYgBDAEEwDwYDVR0TAQH/BAUwAwEB
# /zAfBgNVHSMEGDAWgBTIftJqhSobyhmYBAcnz1AQT2ioojCBhAYDVR0fBH0wezB5
# oHegdYZzaHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9jcmwvTWljcm9z
# b2Z0JTIwSWRlbnRpdHklMjBWZXJpZmljYXRpb24lMjBSb290JTIwQ2VydGlmaWNh
# dGUlMjBBdXRob3JpdHklMjAyMDIwLmNybDCBlAYIKwYBBQUHAQEEgYcwgYQwgYEG
# CCsGAQUFBzAChnVodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20vcGtpb3BzL2NlcnRz
# L01pY3Jvc29mdCUyMElkZW50aXR5JTIwVmVyaWZpY2F0aW9uJTIwUm9vdCUyMENl
# cnRpZmljYXRlJTIwQXV0aG9yaXR5JTIwMjAyMC5jcnQwDQYJKoZIhvcNAQEMBQAD
# ggIBAF+Idsd+bbVaFXXnTHho+k7h2ESZJRWluLE0Oa/pO+4ge/XEizXvhs0Y7+KV
# Yyb4nHlugBesnFqBGEdC2IWmtKMyS1OWIviwpnK3aL5JedwzbeBF7POyg6IGG/Xh
# hJ3UqWeWTO+Czb1c2NP5zyEh89F72u9UIw+IfvM9lzDmc2O2END7MPnrcjWdQnrL
# n1Ntday7JSyrDvBdmgbNnCKNZPmhzoa8PccOiQljjTW6GePe5sGFuRHzdFt8y+bN
# 2neF7Zu8hTO1I64XNGqst8S+w+RUdie8fXC1jKu3m9KGIqF4aldrYBamyh3g4nJP
# j/LR2CBaLyD+2BuGZCVmoNR/dSpRCxlot0i79dKOChmoONqbMI8m04uLaEHAv4qw
# KHQ1vBzbV/nG89LDKbRSSvijmwJwxRxLLpMQ/u4xXxFfR4f/gksSkbJp7oqLwliD
# m/h+w0aJ/U5ccnYhYb7vPKNMN+SZDWycU5ODIRfyoGl59BsXR/HpRGtiJquOYGmv
# A/pk5vC1lcnbeMrcWD/26ozePQ/TWfNXKBOmkFpvPE8CH+EeGGWzqTCjdAsno2jz
# TeNSxlx3glDGJgcdz5D/AAxw9Sdgq/+rY7jjgs7X6fqPTXPmaCAJKVHAP19oEjJI
# BwD1LyHbaEgBxFCogYSOiUIr0Xqcr1nJfiWG2GwYe6ZoAF1bMIIHlzCCBX+gAwIB
# AgITMwAAAFXZ3WkmKPn44gAAAAAAVTANBgkqhkiG9w0BAQwFADBhMQswCQYDVQQG
# EwJVUzEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylN
# aWNyb3NvZnQgUHVibGljIFJTQSBUaW1lc3RhbXBpbmcgQ0EgMjAyMDAeFw0yNTEw
# MjMyMDQ2NDlaFw0yNjEwMjIyMDQ2NDlaMIHbMQswCQYDVQQGEwJVUzETMBEGA1UE
# CBMKV2FzaGluZ3RvbjEQMA4GA1UEBxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9z
# b2Z0IENvcnBvcmF0aW9uMSUwIwYDVQQLExxNaWNyb3NvZnQgQW1lcmljYSBPcGVy
# YXRpb25zMScwJQYDVQQLEx5uU2hpZWxkIFRTUyBFU046N0QwMC0wNUUwLUQ5NDcx
# NTAzBgNVBAMTLE1pY3Jvc29mdCBQdWJsaWMgUlNBIFRpbWUgU3RhbXBpbmcgQXV0
# aG9yaXR5MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAvbkfkh5ZSLP0
# MCUWafaw/KZoVZu9iQx8r5JwhZvdrUi86UjCCFQONjQanrIxGF9hRGIZLQZ50gHr
# LC+4fpUEJff5t04VwByWC2/bWOuk6NmaTh9JpPZDcGzNR95QlryjfEjtl+gxj12z
# NPEdADPplVfzt8cYRWFBx/Fbfch08k6P9p7jX2q1jFPbUxWYJ+xOyGC1aKhDGY5b
# +8wL39v6qC0HFIx/v3y+bep+aEXooK8VoeWK+szfaFjXo8YTcvQ8UL4szu9HFTuZ
# Nv6vvoJ7Ju+o5aTj51sph+0+FXW38TlL/rDBd5ia79jskLtOeHbDjkbljilwzegc
# xv9i49F05ZrS/5ELZCCY1VaqO7EOLKVaxxdAO5oy1vb0Bx0ZRVX1mxFjYzay2EC0
# 51k6yGJHm58y1oe2IKRa/SM1+BTGse6vHNi5Q2d5ZnoR9AOAUDDwJIIqRI4rZz2M
# Sinh11WrXTG9urF2uoyd5Ve+8hxes9ABeP2PYQKlXYTAxvdaeanDTQ/vwmnM+yTc
# WzrVm84Z38XVFw4G7p/ZNZ2nscvv6uru2AevXcyV1t8ha7iWmhhgTWBNBrViuDlc
# 3iPvOz2SVPbPeqhyY/NXwNZCAgc2H5pOztu6MwQxDIjte3XM/FkKBxHofS2abNT/
# 0HG+xZtFqUJDaxgbJa6lN1zh7spjuQ8CAwEAAaOCAcswggHHMB0GA1UdDgQWBBRW
# BF8QbdwIA/DIv6nJFsrB16xltjAfBgNVHSMEGDAWgBRraSg6NS9IY0DPe9ivSek+
# 2T3bITBsBgNVHR8EZTBjMGGgX6BdhltodHRwOi8vd3d3Lm1pY3Jvc29mdC5jb20v
# cGtpb3BzL2NybC9NaWNyb3NvZnQlMjBQdWJsaWMlMjBSU0ElMjBUaW1lc3RhbXBp
# bmclMjBDQSUyMDIwMjAuY3JsMHkGCCsGAQUFBwEBBG0wazBpBggrBgEFBQcwAoZd
# aHR0cDovL3d3dy5taWNyb3NvZnQuY29tL3BraW9wcy9jZXJ0cy9NaWNyb3NvZnQl
# MjBQdWJsaWMlMjBSU0ElMjBUaW1lc3RhbXBpbmclMjBDQSUyMDIwMjAuY3J0MAwG
# A1UdEwEB/wQCMAAwFgYDVR0lAQH/BAwwCgYIKwYBBQUHAwgwDgYDVR0PAQH/BAQD
# AgeAMGYGA1UdIARfMF0wUQYMKwYBBAGCN0yDfQEBMEEwPwYIKwYBBQUHAgEWM2h0
# dHA6Ly93d3cubWljcm9zb2Z0LmNvbS9wa2lvcHMvRG9jcy9SZXBvc2l0b3J5Lmh0
# bTAIBgZngQwBBAIwDQYJKoZIhvcNAQEMBQADggIBAFIe4ZJUe9qUKcWeWypchB58
# fXE/ZIWv2D5XP5/k/tB7LCN9BvmNSVKZ3VeclQM978wfEvuvdMQSUv6Y20boIM8D
# K1K1IU9cP21MG0ExiHxaqjrikf2qbfrXIip4Ef3v2bNYKQxCxN3Sczp1SX0H7uqK
# 2L5OhfDEiXf15iou5hh+EPaaqp49czNQpJDOR/vfJghUc/qcslDPhoCZpZx8b2OD
# vywGQNXwqlbsmCS24uGmEkQ3UH5JUeN6c91yasVchS78riMrm6R9ZpAiO5pfNKMG
# U2MLm1A3pp098DcbFTAc95Hh6Qvkh//28F/Xe2bMFb6DL7Sw0ZO95v0gv0ZTyJfx
# S/LCxfraeEII9FSFOKAMEp1zNFSs2ue0GGjBt9yEEMUwvxq9ExFz0aZzYm8ivJff
# fpIVDnX/+rVRTYcxIkQyFYslIhYlWF9SjCw5r49qakjMRNh8W9O7aaoolSVZleQZ
# jGt0K8JzMlyp6hp2lbW6XqRx2cOHbbxJDxmENzohGUziI13lI2g2Bf5qibfC4bKN
# RpJo9lbE8HUbY0qJiE8u3SU8eDQaySPXOEhJjxRCQwwOvejYmBG5P7CckQNBSnnl
# 12+FKRKgPoj0Mv+z5OMhj9z2MtpbnHLAkep0odQClEyyCG/uR5tK5rW6mZH5Oq56
# UWS0NI6NV1JGS7Jri6jFMYIHQzCCBz8CAQEweDBhMQswCQYDVQQGEwJVUzEeMBwG
# A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylNaWNyb3NvZnQg
# UHVibGljIFJTQSBUaW1lc3RhbXBpbmcgQ0EgMjAyMAITMwAAAFXZ3WkmKPn44gAA
# AAAAVTANBglghkgBZQMEAgEFAKCCBJwwEQYLKoZIhvcNAQkQAg8xAgUAMBoGCSqG
# SIb3DQEJAzENBgsqhkiG9w0BCRABBDAcBgkqhkiG9w0BCQUxDxcNMjYwNTA0MTY1
# NDI4WjAvBgkqhkiG9w0BCQQxIgQgg7tuOfcWuHaEfKjfSAV9p6HjoxfkND4OWtqv
# oAoLTy8wgbkGCyqGSIb3DQEJEAIvMYGpMIGmMIGjMIGgBCDYuTyXZIZiu799/v4P
# aqsmeSzBxh0rqkYq7sYYavj+zTB8MGWkYzBhMQswCQYDVQQGEwJVUzEeMBwGA1UE
# ChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylNaWNyb3NvZnQgUHVi
# bGljIFJTQSBUaW1lc3RhbXBpbmcgQ0EgMjAyMAITMwAAAFXZ3WkmKPn44gAAAAAA
# VTCCA14GCyqGSIb3DQEJEAISMYIDTTCCA0mhggNFMIIDQTCCAikCAQEwggEJoYHh
# pIHeMIHbMQswCQYDVQQGEwJVUzETMBEGA1UECBMKV2FzaGluZ3RvbjEQMA4GA1UE
# BxMHUmVkbW9uZDEeMBwGA1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMSUwIwYD
# VQQLExxNaWNyb3NvZnQgQW1lcmljYSBPcGVyYXRpb25zMScwJQYDVQQLEx5uU2hp
# ZWxkIFRTUyBFU046N0QwMC0wNUUwLUQ5NDcxNTAzBgNVBAMTLE1pY3Jvc29mdCBQ
# dWJsaWMgUlNBIFRpbWUgU3RhbXBpbmcgQXV0aG9yaXR5oiMKAQEwBwYFKw4DAhoD
# FQAdO1QBgmW/tuBZV5EGjhfsV4cN6qBnMGWkYzBhMQswCQYDVQQGEwJVUzEeMBwG
# A1UEChMVTWljcm9zb2Z0IENvcnBvcmF0aW9uMTIwMAYDVQQDEylNaWNyb3NvZnQg
# UHVibGljIFJTQSBUaW1lc3RhbXBpbmcgQ0EgMjAyMDANBgkqhkiG9w0BAQsFAAIF
# AO2i0XAwIhgPMjAyNjA1MDQwODA0MDBaGA8yMDI2MDUwNTA4MDQwMFowdDA6Bgor
# BgEEAYRZCgQBMSwwKjAKAgUA7aLRcAIBADAHAgEAAgJJhzAHAgEAAgITWjAKAgUA
# 7aQi8AIBADA2BgorBgEEAYRZCgQCMSgwJjAMBgorBgEEAYRZCgMCoAowCAIBAAID
# B6EgoQowCAIBAAIDAYagMA0GCSqGSIb3DQEBCwUAA4IBAQATBf9Myhgwab68HPaH
# NpSEvB6C49nbZ/LjpdwWVvIKERGqINntLyRKZOlnQHsUSXT5kXbFAkHY8Gq/yceF
# Iz34q08GIazjM0vHPs+f2rij9zHVheSTULLwCFErq6IZt0C6cP6fHmhey5cmHx9H
# 0tFKZeuKG3xal6bGSS+Du74lVJZSQZOALahQeipNvLPEpyoeFtkBt9Cf3KbpZ0fS
# Dxrcl+P1NMPcK83EcvxsDzrUwcUqgueWaYYqVU6SLJRGL1fpsHk79pYUlAoqxdU8
# 5uLtwuUmagjVSMz1g6PwfWQLbZX/YjknXx5qmXWav5Xf0BwS9QQNfAjt9DuSUOey
# XtBTMA0GCSqGSIb3DQEBAQUABIICAEpkTOzXJKCOafU9hEsTl8iub/MSzYTJHoL1
# YsIfT1jG8pyl9OW7+/f/9QDsZES48iI2gz8qd88Ja5vX0gXbDTjz3+f0rBnzgbBD
# Ly6M4NmZ05ay+63NkwxcDB0K39XKGp//Kcah+E+hIVflbEVOD4MoXAoKfN/ucz4F
# bkucS4CXQ4fsKWYqdt1p/IKQzXxuzPhGOYbrYQANbLhkbghWnwA5EFUliMGWbxne
# 2cv7gq0BbQwfd3jIfVaVm+uc1OLC7Gi8usvJh8BzC9Q9N/Warm6gzcUF3HY0pbQ7
# IrbXkBsrM/7ag+m7cLB0DaGoQDLPnrJWIyKoElOuFaZ726G7rWKZpXIdP6REwA1l
# Jch3grV03euTX7GVCsqRhiHCJM9Xh0MGkNVkCLlQrnpdPBQgIrBWlD+HxHAt8piR
# 95m9EXp2e1jM2FfSTWlvPcR7I8CCGh0AHHQFl6+pgTmI8KOhvFr8AEpRMqIN414r
# oloqu4hmY75CoaDNhruerF1ZYbp1tOW+SFPvaNOwYGALigkwzzXPapGjp5p2Ex92
# JDIEZbdjcn3ll6LYalOiIS8gSXGhFliqc7i1eWj0h50bJJfQtWXka5LGFlhQgk6v
# 0CQEVWofiHPobTB40MH09NeAixYMd4Si2aiouj1U/m5Imlso4zVRP3dzymdXX/Cf
# fSwigNT1
# SIG # End signature block
