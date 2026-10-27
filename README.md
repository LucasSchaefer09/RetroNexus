# RetroNexus

> Uma biblioteca retrô para organizar, gerenciar e executar ports nativos de jogos. Disponível para Windows, com suporte a Linux em breve.

O RetroNexus reúne em uma biblioteca local os jogos que você já possui. Cadastre manualmente o executável, console, capa, descrição e argumentos de inicialização; encontre seus jogos por pesquisa, filtros, favoritos e visualização em grade ou lista; e abra-os pelo launcher.

O projeto não baixa, instala nem remove jogos. Os registros e as preferências de aparência ficam salvos localmente no dispositivo.

## Licença

Este projeto é distribuído sob a licença [MIT](./LICENSE).

## Recursos

- Cadastro, edição e remoção de jogos sem apagar os executáveis originais.
- Organização por console, pesquisa, favoritos e ordenação.
- Capas, descrições, gênero, diretório de trabalho e argumentos opcionais.
- Inicialização de programas configurados, sem invocar um shell.
- Aparência personalizável: tema claro/escuro, cor de destaque, tamanho dos cartões e visualização padrão.
- Banco de dados SQLite e preferências locais.
- Interface em português brasileiro.

**Plataformas:** a versão portátil para Windows foi gerada e testada. O suporte e os pacotes Linux estão planejados; ainda não foram validados neste projeto.

## Requisitos

- Node.js 20.19+ ou 22.12+ (Electron/Vite)
- npm

## Desenvolvimento

```bash
npm install
npm run dev
```

O banco SQLite via WASM e o arquivo separado de preferências são criados automaticamente no diretório de dados de usuário do Electron (em Windows, `%APPDATA%/retronexus`; em Linux, `$XDG_CONFIG_HOME` ou `~/.config/retronexus`). Não apague essa pasta se quiser manter sua biblioteca e suas configurações.

## Verificação e build

```bash
npm run typecheck
npm run build
```

Para empacotar no sistema operacional atual:

```bash
npm run dist
```

Ou gerar o pacote correspondente no sistema de destino:

```bash
npm run dist:win
npm run dist:linux
```

Os alvos configurados são instalador NSIS e executável portátil para Windows, além de AppImage/DEB para Linux. Builds de distribuição devem ser gerados e testados no sistema operacional de destino; a configuração de empacotamento Linux ainda não foi validada.

No Windows, também é possível gerar o executável portátil com o ícone RetroNexus:

```bash
npm run dist:portable
```

O ícone de Windows fica em `build/icon.ico`; o PNG correspondente é usado nos pacotes Linux. Preferências de aparência são gravadas separadamente em `settings.json`, dentro do diretório de dados de usuário.

## Uso

Adicione um jogo pela interface, selecione o console e o executável, e opcionalmente informe capa, descrição, diretório de trabalho e argumentos. No Linux, o arquivo escolhido precisa ter permissão de execução. Os argumentos são divididos sem shell; scripts ou comandos vindos de arquivos externos não são executados pelo launcher.
