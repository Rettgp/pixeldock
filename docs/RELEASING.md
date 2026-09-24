# Releasing PixelDock

Pushing a `v*` tag runs `.github/workflows/publish.yml`, which lints, tests,
builds the Windows installer, publishes it to a GitHub release and writes the
changelog.

```bash
git tag v1.0.1
git push origin v1.0.1
```

Two optional, free extras make the installer friendlier on Windows. Both
switch on through repository settings, so releases keep working before
either is set up.

## Code signing (SignPath Foundation)

Unsigned installers trigger Microsoft Defender SmartScreen's "Windows
protected your PC" warning. [SignPath Foundation](https://signpath.org)
signs open-source projects for free with a certificate that already has
SmartScreen reputation.

1. Apply at <https://signpath.org> with this repository (it must stay public
   and keep an OSI license: `LICENSE` is MIT).
2. In the SignPath project, set the artifact configuration to
   [`.signpath/artifact-configuration.xml`](../.signpath/artifact-configuration.xml)
   and link it to the GitHub repository as a trusted build system.
3. In GitHub **Settings → Secrets and variables → Actions**, add:

    | Type     | Name                           | Value                             |
    | -------- | ------------------------------ | --------------------------------- |
    | Secret   | `SIGNPATH_API_TOKEN`           | API token of the SignPath CI user |
    | Variable | `SIGNPATH_ORGANIZATION_ID`     | Your SignPath organization ID     |
    | Variable | `SIGNPATH_PROJECT_SLUG`        | e.g. `pixeldock`                  |
    | Variable | `SIGNPATH_SIGNING_POLICY_SLUG` | e.g. `release-signing`            |

Once `SIGNPATH_ORGANIZATION_ID` is set, every release sends the installer to
SignPath, waits for the signed copy, and publishes that instead. Signing
changes the file's bytes, so the workflow also refreshes `latest.yml` and
drops the now-stale `.blockmap`.

The installer shows **SignPath Foundation** as its publisher. SignPath
Foundation may require a manual approval on each signing request; the
workflow waits for it.

## winget

Publishing to the Windows Package Manager lets people install with
`winget install Rettgp.PixelDock`, which avoids the SmartScreen prompt.

**First submission (once, by hand):**

1. After a release, download the `winget-manifests` artifact from the
   workflow run. It contains
   `manifests/r/Rettgp/PixelDock/<version>/` with the three manifest files,
   already pointing at the release installer with its SHA-256.
2. Fork <https://github.com/microsoft/winget-pkgs>, copy that folder into the
   same path, and open a pull request. Automated validation runs on it.

**Later releases (automatic):**

1. Create a classic GitHub token with the `public_repo` scope and add it as
   the `WINGET_TOKEN` secret.
2. Add the variable `WINGET_AUTO_UPDATE` = `true`.

The `winget` job then runs `wingetcreate update` after each release and opens
the winget-pkgs pull request for you.
