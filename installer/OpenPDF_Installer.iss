; =============================================================================
;  OpenPDF v2.1.0 - Script de Inno Setup 6
;  Instalador corporativo con interfaz moderna, licencia, cierre automatico de
;  instancias previas, accesos directos y desinstalador limpio.
; =============================================================================

#define AppName        "OpenPDF"
#define AppVersion     "2.1.0"
#define AppPublisher   "OpenPDF Project"
#define AppURL         "https://github.com/albert-dilas/OpenPDF"
#define AppWebURL      "https://albert-dilas.github.io/OpenPDF"
#define AppExeName     "OpenPDF.exe"
#define AppDescription "Suite Local-First de Procesamiento Documental PDF"
#define AppCopyright   "Copyright (C) 2026 OpenPDF Project. MIT License."

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
OutputBaseFilename=OpenPDF_Setup_v{#AppVersion}
SetupIconFile=openpdf.ico
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName} v{#AppVersion}

LicenseFile=assets\LICENSE.txt
InfoBeforeFile=assets\README.txt

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
DisableProgramGroupPage=yes
DisableWelcomePage=no
DisableReadyMemo=no
DisableReadyPage=no
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
Name: "desktopicon";   Description: "Crear acceso directo en el Escritorio";               GroupDescription: "Accesos directos del sistema:"; Flags: checkedonce
Name: "startmenuicon"; Description: "Crear carpeta en el Menu de Inicio";                  GroupDescription: "Accesos directos del sistema:"; Flags: checkedonce
Name: "autostart";     Description: "Iniciar OpenPDF automaticamente al iniciar Windows";  GroupDescription: "Opciones de ejecucion:";        Flags: unchecked

; =============================================================================
[Files]
Source: "..\dist\OpenPDF.exe";      DestDir: "{app}"; Flags: ignoreversion
Source: "assets\LICENSE.txt";       DestDir: "{app}"; Flags: ignoreversion
Source: "assets\README.txt";        DestDir: "{app}"; Flags: ignoreversion

; =============================================================================
[Icons]
Name: "{group}\{#AppName}";               Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\{#AppExeName}"; Comment: "{#AppDescription}"; Tasks: startmenuicon
Name: "{group}\Desinstalar {#AppName}";   Filename: "{uninstallexe}"; Comment: "Desinstalar {#AppName}"; Tasks: startmenuicon
Name: "{userdesktop}\{#AppName}";         Filename: "{app}\{#AppExeName}"; IconFilename: "{app}\{#AppExeName}"; Comment: "{#AppDescription}"; Tasks: desktopicon

; =============================================================================
[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#AppName}"; ValueData: """{app}\{#AppExeName}"""; Flags: uninsdeletevalue; Tasks: autostart
Root: HKCU; Subkey: "Software\{#AppPublisher}\{#AppName}"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKCU; Subkey: "Software\{#AppPublisher}\{#AppName}"; ValueType: string; ValueName: "Version";     ValueData: "{#AppVersion}"; Flags: uninsdeletekey

; =============================================================================
[Run]
Filename: "{app}\{#AppExeName}"; Description: "Ejecutar {#AppName} v{#AppVersion} al finalizar"; Flags: nowait postinstall skipifsilent shellexec

; =============================================================================
[UninstallDelete]
Type: filesandordirs; Name: "{app}\temp_files"
Type: filesandordirs; Name: "{localappdata}\{#AppName}"

; =============================================================================
[Code]

procedure StopRunningOpenPDF();
var
  ResultCode: Integer;
begin
  Exec(ExpandConstant('{sys}\taskkill.exe'), '/F /IM {#AppExeName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
end;

function PrepareToInstall(var NeedsRestart: Boolean): String;
begin
  StopRunningOpenPDF();
  Result := '';
end;

function InitializeUninstall(): Boolean;
begin
  StopRunningOpenPDF();
  Result := True;
end;

procedure InitializeWizard();
var
  Bienvenida: String;
  NL: String;
begin
  NL := Chr(13) + Chr(10);

  WizardForm.WelcomeLabel1.Font.Style := [fsBold];
  WizardForm.WelcomeLabel1.Caption := 'Instalacion de OpenPDF v{#AppVersion}';

  Bienvenida := 'Este asistente instalara OpenPDF v{#AppVersion} en tu equipo.' + NL + NL;
  Bienvenida := Bienvenida + 'OpenPDF es una plataforma Local-First de 21 modulos especializados' + NL;
  Bienvenida := Bienvenida + 'para unir, dividir, organizar, firmar, censurar, comprimir, traducir' + NL;
  Bienvenida := Bienvenida + 'y convertir documentos PDF con privacidad y control total.' + NL + NL;
  Bienvenida := Bienvenida + 'Arquitectura de privacidad estricta:' + NL;
  Bienvenida := Bienvenida + '  - Ejecucion 100% local en 127.0.0.1' + NL;
  Bienvenida := Bienvenida + '  - Utilidades Online con proteccion anti-SSRF' + NL;
  Bienvenida := Bienvenida + '  - Limpieza automatica de archivos temporales' + NL + NL;
  Bienvenida := Bienvenida + 'Haz clic en Siguiente para continuar con la instalacion.';

  WizardForm.WelcomeLabel2.Caption := Bienvenida;
end;

function UpdateReadyMemo(Space, NewLine, MemoUserInfoInfo, MemoDirInfo,
  MemoTypeInfo, MemoComponentsInfo, MemoGroupInfo, MemoTasksInfo: String): String;
var
  S: String;
begin
  S := 'CONFIGURACION DE LA INSTALACION (OpenPDF v{#AppVersion})' + NewLine;
  S := S + '=======================================================' + NewLine + NewLine;

  if MemoDirInfo <> '' then
    S := S + 'Directorio de destino:' + NewLine + Space + MemoDirInfo + NewLine + NewLine;

  if MemoTasksInfo <> '' then
    S := S + 'Tareas adicionales:' + NewLine + MemoTasksInfo + NewLine + NewLine;

  S := S + 'MODULOS INCLUIDOS (21 HERRAMIENTAS)' + NewLine;
  S := S + '-----------------------------------' + NewLine;
  S := S + Space + '[Organizar]   Unir PDF, Dividir PDF, Organizar PDF, Rotar PDF' + NewLine;
  S := S + Space + '[Optimizar]   Comprimir PDF (3 niveles), OCR PDF' + NewLine;
  S := S + Space + '[Convertir]   PDF <-> Word, JPG <-> PDF, Markdown, Web a PDF, Traducir' + NewLine;
  S := S + Space + '[Editar]      Marca de Agua, Numeros de Pagina, Metadatos, Codigo QR Web' + NewLine;
  S := S + Space + '[Seguridad]   Firmar/Sellar, Censurar/Redactar, Proteger AES-256, Desbloquear' + NewLine + NewLine;
  S := S + 'Garantia Local-First: Procesamiento integro en el equipo local.' + NewLine;

  Result := S;
end;
