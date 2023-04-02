gulp buildAll

New-Item -Path '.\release\DarkHeresy2E-FoundryVTT-master' -ItemType Directory

Copy-Item -Path ".\asset" -Destination ".\release\DarkHeresy2E-FoundryVTT-master" -Recurse
Copy-Item -Path ".\css" -Destination ".\release\DarkHeresy2E-FoundryVTT-master" -Recurse
Copy-Item -Path ".\lang" -Destination ".\release\DarkHeresy2E-FoundryVTT-master" -Recurse
Copy-Item -Path ".\logo" -Destination ".\release\DarkHeresy2E-FoundryVTT-master" -Recurse
Copy-Item -Path ".\packs" -Destination ".\release\DarkHeresy2E-FoundryVTT-master" -Recurse
Copy-Item -Path ".\script" -Destination ".\release\DarkHeresy2E-FoundryVTT-master" -Recurse
Copy-Item -Path ".\template" -Destination ".\release\DarkHeresy2E-FoundryVTT-master" -Recurse
Copy-item -Path ".\CONTRIBUTING.md" -Destination ".\release\DarkHeresy2E-FoundryVTT-master"
Copy-item -Path ".\README.md" -Destination ".\release\DarkHeresy2E-FoundryVTT-master"
Copy-item -Path ".\LICENSE" -Destination ".\release\DarkHeresy2E-FoundryVTT-master"
Copy-item -Path ".\system.json" -Destination ".\release\DarkHeresy2E-FoundryVTT-master"
Copy-item -Path ".\template.json" -Destination ".\release\DarkHeresy2E-FoundryVTT-master"

$compress = @{
	Path = ".\release\*"
	CompressionLevel = "Optimal"
	DestinationPath = ".\dark-heresy.zip"
}
Compress-Archive @compress -Force

Remove-Item '.\release' -Recurse