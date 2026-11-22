; =============================================================================
;  Tornio v3.0.0 - Instalador Minimalista de 3 Pasos (Inno Setup 6)
;  1. Bienvenida y Licencia Apache 2.0
;  2. Destino y Preferencias de Escritorio (sincronizadas con config.json)
;  3. Instalacion directa y Finalizar
; =============================================================================

#define AppName        "Tornio"
#define AppVersion     "3.0.0"
#define AppPublisher   "Tornio Project"
#define AppURL         "https://github.com/albert-dilas/OpenPDF"
#define AppWebURL      "https://albert-dilas.github.io/OpenPDF"
#define AppExeName     "Tornio.exe"
#define AppDescription "Workbench Local-First para PDF, Video, Audio, Imagenes e IA"
#define AppCopyright   "Copyright (C) 2026 Tornio Project. Apache License 2.0."

; =============================================================================
[Setup]
AppId={{A3F2C1D4-8B5E-4F9A-B2C7-D1E6F3A4B5C8}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} v{#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppWebURL}
AppSupportURL={#AppURL}/issues
AppUpdatesURL={#AppURL}/releases
AppCopyright={#AppCopyright}
AppComments={#AppDescription}

DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}

PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog

OutputDir=..\dist
OutputBaseFilename=Tornio_Setup_v{#AppVersion}
SetupIconFile=tornio.ico
UninstallDisplayIcon={app}\tornio.ico
UninstallDisplayName={#AppName} v{#AppVersion}

LicenseFile=assets\LICENSE.txt

Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes
LZMANumBlockThreads=4

WizardStyle=modern
WizardSizePercent=115,115
WizardImageFile=wizard_banner.bmp
WizardSmallImageFile=wizard_small.bmp
WizardImageStretch=yes

ShowLanguageDialog=no
LanguageDetectionMethod=uilanguage
AllowNoIcons=yes
DisableWelcomePage=no
DisableProgramGroupPage=yes
DisableReadyMemo=yes
DisableReadyPage=yes
CloseApplications=force
RestartIfNeededByRun=no
ArchitecturesInstallIn64BitMode=x64compatible

VersionInfoVersion={#AppVersion}.0
VersionInfoCompany={#AppPublisher}
VersionInfoDescription={#AppName} v{#AppVersion} Setup
VersionInfoProductName={#AppName}
VersionInfoProductVersion={#AppVersion}
VersionInfoCopyright={#AppCopyright}

; =============================================================================
[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

; =============================================================================
[Tasks]
Name: "desktopicon";    Description: "Crear acceso directo en el Escritorio";                                     GroupDescription: "Accesos directos:";          Flags: checkedonce
Name: "contextmenu";    Description: "Anadir 'Abrir con Tornio' al menu contextual (clic derecho en archivos)";   GroupDescription: "Integracion con Windows:";   Flags: checkedonce
Name: "backgroundtray"; Description: "Mantener en segundo plano (bandeja del sistema para apertura instantanea)"; GroupDescription: "Ejecucion y segundo plano:"; Flags: unchecked
Name: "autostart";      Description: "Iniciar Tornio minimizado al encender Windows";                            GroupDescription: "Ejecucion y segundo plano:"; Flags: unchecked
Name: "autoupdate";     Description: "Comprobar actualizaciones automaticamente (verificadas con SHA-256)";       GroupDescription: "Actualizaciones:";           Flags: checkedonce

; =============================================================================
[Files]
Source: "..\dist\Tornio.exe";         DestDir: "{app}"; Flags: ignoreversion
Source: "tornio.ico";                 DestDir: "{app}"; Flags: ignoreversion
Source: "assets\LICENSE.txt";         DestDir: "{app}"; Flags: ignoreversion
Source: "..\NOTICE";                  DestDir: "{app}"; Flags: ignoreversion
Source: "..\THIRD_PARTY_NOTICES.md";  DestDir: "{app}"; Flags: ignoreversion

; =============================================================================
[Icons]
Name: "{group}\{#AppName}";               Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\tornio.ico"; Comment: "{#AppDescription}"
Name: "{group}\Desinstalar {#AppName}";   Filename: "{uninstallexe}"; Comment: "Desinstalar {#AppName}"
Name: "{userdesktop}\{#AppName}";         Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\tornio.ico"; Comment: "{#AppDescription}"; Tasks: desktopicon

; =============================================================================
[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#AppName}"; ValueData: """{app}\{#AppExeName}"" --background"; Flags: uninsdeletevalue; Tasks: autostart
Root: HKCU; Subkey: "Software\Classes\*\shell\Tornio"; ValueType: string; ValueName: ""; ValueData: "Abrir con Tornio"; Flags: uninsdeletekey; Tasks: contextmenu
Root: HKCU; Subkey: "Software\Classes\*\shell\Tornio"; ValueType: string; ValueName: "Icon"; ValueData: "{app}\tornio.ico,0"; Flags: uninsdeletekey; Tasks: contextmenu
Root: HKCU; Subkey: "Software\Classes\*\shell\Tornio\command"; ValueType: string; ValueName: ""; ValueData: """{app}\{#AppExeName}"" ""%1"""; Flags: uninsdeletekey; Tasks: contextmenu
Root: HKCU; Subkey: "Software\{#AppName}"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\{#AppName}"; ValueType: string; ValueName: "Version";     ValueData: "{#AppVersion}"; Flags: uninsdeletekey

; =============================================================================
[Run]
Filename: "{app}\{#AppExeName}"; Description: "Ejecutar {#AppName} v{#AppVersion} al finalizar"; Flags: nowait postinstall skipifsilent shellexec

; =============================================================================
[UninstallDelete]
Type: filesandordirs; Name: "{app}\temp_files"

; =============================================================================
[Code]

procedure SHChangeNotify(wEventId: Integer; uFlags: Cardinal; dwItem1: Integer; dwItem2: Integer);
  external 'SHChangeNotify@shell32.dll stdcall';

procedure StopRunningTornio();
var
  ResultCode: Integer;
begin
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /IM {#AppExeName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /IM OpenPDF.exe', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;

function BoolToJson(B: Boolean): String;
begin
  if B then Result := 'true' else Result := 'false';
end;

function EscapeJsonStr(const S: String): String;
var
  I: Integer;
  Ch: Char;
begin
  Result := '';
  for I := 1 to Length(S) do
  begin
    Ch := S[I];
    if Ch = '\' then
      Result := Result + '\\'
    else if Ch = '"' then
      Result := Result + '\"'
    else
      Result := Result + Ch;
  end;
end;

procedure WriteDesktopConfigJson();
var
  DataDir: String;
  CfgPath: String;
  DownloadsDir: String;
  UpdateMode: String;
  KeepBg: Boolean;
  AutoStart: Boolean;
  CtxMenu: Boolean;
  DesktopJson: String;
  ExistingText: AnsiString;
  JsonOut: String;
  Trimmed: String;
  NL: String;
begin
  NL := #13#10;
  DataDir := ExpandConstant('{localappdata}\{#AppName}');
  CfgPath := DataDir + '\config.json';
  ForceDirectories(DataDir);

  KeepBg := WizardIsTaskSelected('backgroundtray');
  AutoStart := WizardIsTaskSelected('autostart');
  CtxMenu := WizardIsTaskSelected('contextmenu');
  if WizardIsTaskSelected('autoupdate') then
    UpdateMode := 'notify'
  else
    UpdateMode := 'manual';

  DownloadsDir := ExpandConstant('{%USERPROFILE}\Downloads\Tornio');

  DesktopJson :=
    '  "desktop": {' + NL +
    '    "keep_in_background": ' + BoolToJson(KeepBg) + ',' + NL +
    '    "start_with_windows": ' + BoolToJson(AutoStart) + ',' + NL +
    '    "start_minimized": true,' + NL +
    '    "context_menu_enabled": ' + BoolToJson(CtxMenu) + ',' + NL +
    '    "update_mode": "' + UpdateMode + '",' + NL +
    '    "save_mode": "ask",' + NL +
    '    "default_output_dir": "' + EscapeJsonStr(DownloadsDir) + '",' + NL +
    '    "clean_temp_on_exit": true,' + NL +
    '    "smart_zip_downloads": true' + NL +
    '  }';

  if FileExists(CfgPath) and LoadStringFromFile(CfgPath, ExistingText) then
  begin
    Trimmed := Trim(String(ExistingText));
    if (Length(Trimmed) > 2) and (Trimmed[1] = '{') and (Trimmed[Length(Trimmed)] = '}') and (Pos('"desktop"', Trimmed) = 0) then
    begin
      Delete(Trimmed, Length(Trimmed), 1);
      JsonOut := TrimRight(Trimmed) + ',' + NL + DesktopJson + NL + '}';
      SaveStringToFile(CfgPath, AnsiString(JsonOut), False);
      Exit;
    end;
    if Pos('"desktop"', Trimmed) > 0 then
    begin
      { En actualizaciones conserva preferencias previas del usuario }
      Exit;
    end;
  end;

  JsonOut := '{' + NL + '  "custom_paths": {},' + NL + DesktopJson + NL + '}' + NL;
  SaveStringToFile(CfgPath, AnsiString(JsonOut), False);
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
begin
  StopRunningTornio();
  Result := '';
end;

function InitializeUninstall(): Boolean;
begin
  StopRunningTornio();
  Result := True;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    WriteDesktopConfigJson();
    SHChangeNotify($08000000, $0000, 0, 0);
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  DataDir: String;
  NL: String;
begin
  if CurUninstallStep = usPostUninstall then
  begin
    DataDir := ExpandConstant('{localappdata}\{#AppName}');
    if DirExists(DataDir) and (not UninstallSilent()) then
    begin
      NL := #13#10;
      if MsgBox(
        'Deseas eliminar tambien tus preferencias, recetas de Pipelines y modelos IA descargados en:' +
        NL + DataDir + NL + NL +
        'Selecciona "No" para conservar tu configuracion si reinstalas Tornio mas adelante.',
        mbConfirmation,
        MB_YESNO or MB_DEFBUTTON2
      ) = IDYES then
      begin
        DelTree(DataDir, True, True, True);
      end;
    end;
    SHChangeNotify($08000000, $0000, 0, 0);
  end;
end;

procedure InitializeWizard();
var
  Bienvenida: String;
  NL: String;
begin
  NL := Chr(13) + Chr(10);

  WizardForm.WelcomeLabel1.Font.Style := [fsBold];
  WizardForm.WelcomeLabel1.Caption := 'Instalacion de {#AppName} v{#AppVersion}';

  Bienvenida := 'Este asistente instalara Tornio v{#AppVersion} en tu equipo en 3 pasos.' + NL + NL;
  Bienvenida := Bienvenida + 'Workbench 100% Local-First con 7 Studios y 58 herramientas para PDF, Video, Audio, Imagenes, Archivos e IA local.' + NL + NL;
  Bienvenida := Bienvenida + '- Ejecucion privada en 127.0.0.1 sin subidas externas' + NL;
  Bienvenida := Bienvenida + '- Control de segundo plano y autoinicio personalizable' + NL;
  Bienvenida := Bienvenida + '- Auto-actualizador verificado con firma SHA-256' + NL + NL;
  Bienvenida := Bienvenida + 'Haz clic en Siguiente para continuar.';

  WizardForm.WelcomeLabel2.Caption := Bienvenida;
end;
