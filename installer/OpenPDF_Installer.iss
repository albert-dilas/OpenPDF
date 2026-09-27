; =============================================================================
;  OpenPDF - Script de Inno Setup 6
;  Instalador profesional con wizard guiado, accesos directos y desinstalador
; =============================================================================

#define AppName        "OpenPDF"
#define AppVersion     "1.0.0"
#define AppPublisher   "OpenPDF Project"
#define AppURL         "https://github.com/openpdf"
#define AppExeName     "OpenPDF.exe"
#define AppDescription "La alternativa open-source, privada y local a iLovePDF"
#define AppCopyright   "Copyright (C) 2026 OpenPDF Project"

; =============================================================================
[Setup]
AppId={{A3F2C1D4-8B5E-4F9A-B2C7-D1E6F3A4B5C8}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppURL}
AppSupportURL={#AppURL}
AppUpdatesURL={#AppURL}
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
UninstallDisplayName={#AppName} {#AppVersion}

Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes
LZMANumBlockThreads=4

WizardStyle=modern
;WizardImageFile=wizard_banner.bmp
;WizardSmallImageFile=wizard_small.bmp
;WizardImageStretch=yes

ShowLanguageDialog=no
LanguageDetectionMethod=uilanguage
AllowNoIcons=yes
DisableProgramGroupPage=yes
DisableReadyMemo=no
DisableReadyPage=no
CloseApplications=yes
RestartIfNeededByRun=no

VersionInfoVersion={#AppVersion}
VersionInfoCompany={#AppPublisher}
VersionInfoDescription={#AppName} Installer
VersionInfoProductName={#AppName}
VersionInfoProductVersion={#AppVersion}
VersionInfoCopyright={#AppCopyright}

; =============================================================================
[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

; =============================================================================
[Tasks]
Name: "desktopicon";   Description: "Crear icono en el Escritorio";                        GroupDescription: "Accesos directos:"; Flags: unchecked
Name: "startmenuicon"; Description: "Crear acceso en el Menu de Inicio";                   GroupDescription: "Accesos directos:"; Flags: checkedonce
Name: "autostart";     Description: "Iniciar OpenPDF automaticamente al encender el PC";   GroupDescription: "Opciones:"; Flags: unchecked

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
Filename: "{app}\{#AppExeName}"; Description: "Abrir {#AppName} ahora"; Flags: nowait postinstall skipifsilent shellexec

; =============================================================================
[UninstallDelete]
Type: filesandordirs; Name: "{app}\temp_files"
Type: filesandordirs; Name: "{localappdata}\{#AppName}"

; =============================================================================
[Code]

procedure InitializeWizard();
var
  Bienvenida: String;
  NL: String;
begin
  NL := Chr(13) + Chr(10);
  WizardForm.WelcomeLabel1.Caption := 'Bienvenido a OpenPDF 1.0.0';
  Bienvenida := 'Este asistente te guiara durante la instalacion de OpenPDF.' + NL + NL;
  Bienvenida := Bienvenida + 'OpenPDF es una suite de 14 herramientas PDF que funciona' + NL;
  Bienvenida := Bienvenida + '100% de forma local en tu equipo. Tus documentos NUNCA' + NL;
  Bienvenida := Bienvenida + 'salen de tu computadora.' + NL + NL;
  Bienvenida := Bienvenida + 'Haz clic en Siguiente para continuar.';
  WizardForm.WelcomeLabel2.Caption := Bienvenida;
end;


function UpdateReadyMemo(Space, NewLine, MemoUserInfoInfo, MemoDirInfo,
  MemoTypeInfo, MemoComponentsInfo, MemoGroupInfo, MemoTasksInfo: String): String;
var
  S: String;
begin
  S := 'RESUMEN DE INSTALACION' + NewLine;
  S := S + '----------------------' + NewLine + NewLine;

  if MemoDirInfo <> '' then
    S := S + 'Carpeta de instalacion:' + NewLine + Space + MemoDirInfo + NewLine + NewLine;

  if MemoTasksInfo <> '' then
    S := S + 'Opciones seleccionadas:' + NewLine + MemoTasksInfo + NewLine + NewLine;

  S := S + 'HERRAMIENTAS INCLUIDAS (14 modulos)' + NewLine;
  S := S + '------------------------------------' + NewLine;
  S := S + Space + '[Organizacion]  Unir, Dividir, Comprimir, Rotar PDF' + NewLine;
  S := S + Space + '[Numeracion]    Agregar numeros de pagina automaticos' + NewLine;
  S := S + Space + '[Conversion]    PDF<->JPG, PDF<->Word, Word->PDF' + NewLine;
  S := S + Space + '[OCR]           Reconocimiento optico de caracteres' + NewLine;
  S := S + Space + '[Seguridad]     Proteger, Desbloquear, Marca de agua' + NewLine;
  S := S + Space + '[Extraccion]    PDF a Markdown (para IA y LLMs)' + NewLine + NewLine;
  S := S + 'Privacidad: Procesamiento 100% local. Sin internet requerido.' + NewLine;

  Result := S;
end;

