## 🎮 Sobre o RetroNexus

O RetroNexus é uma biblioteca pessoal para organizar e executar ports de jogos clássicos de consoles em um só lugar.

Adicione seus jogos, personalize capas e descrições, organize sua coleção por console e utilize a pesquisa, os filtros e os favoritos para encontrar rapidamente o que deseja jogar.

O RetroNexus mantém sua biblioteca e suas preferências armazenadas localmente, oferecendo uma experiência simples e personalizável para Windows e Linux.

## ✨ Funcionalidades

- **Biblioteca pessoal:** adicione, edite e organize seus jogos.
- **Execução com um clique:** abra os executáveis cadastrados diretamente pelo launcher.
- **Organização por consoles:** categorize seus jogos por plataforma de origem.
- **Capas e descrições:** personalize as informações de cada jogo.
- **Pesquisa e filtros:** encontre jogos pelo nome, console ou favoritos.
- **Visualização flexível:** escolha entre grade de cartões ou lista.
- **Personalização visual:** alterne entre os temas claro e escuro, escolha a cor de destaque e ajuste o tamanho dos cartões.
- **Idioma da interface:** escolha entre Português (Brasil) e English nas configurações.
- **Configurações persistentes:** suas preferências e registros ficam armazenados localmente.
- **Suporte multiplataforma planejado:** arquitetura baseada em Electron para possibilitar a distribuição em Windows e Linux.

<img width="1419" height="887" alt="image" src="https://github.com/user-attachments/assets/1511480a-6fb4-4e2c-99d1-ad2b91cd6b0d" />


## 🖥️ Plataformas

| Plataforma | Status |
|---|---|
| Windows x64 | Versão portátil gerada e testada |
| Linux | Planejado; build e funcionamento ainda não validados |

Os executáveis dos jogos devem ser compatíveis com o sistema operacional utilizado. Um programa `.exe` de Windows não funciona necessariamente de forma nativa no Linux.

## 📥 Download

Acesse a seção [Releases](../../releases) para consultar as versões disponíveis.

Para a versão Windows, baixe o executável portátil disponibilizado na Release correspondente e execute-o.

Consulte as notas da versão para verificar os requisitos e as limitações conhecidas.

## 🚀 Executar em modo de desenvolvimento

### Requisitos

- Node.js 20.19+ ou 22.12+.
- npm.
- Git, caso queira clonar o repositório.

### Instalação das dependências

Clone o repositório, entre na pasta do projeto e execute:

```bash
npm install
```

### Iniciar o aplicativo

```bash
npm run dev
```

## 🛠️ Verificação e compilação

Para verificar os tipos do TypeScript:

```bash
npm run typecheck
```

Para compilar o projeto:

```bash
npm run build
```

Para gerar o pacote de distribuição configurado para o sistema operacional atual:

```bash
npm run dist
```

Se os scripts correspondentes estiverem configurados no projeto, também podem ser utilizados:

```bash
npm run dist:win
npm run dist:linux
```

No Windows, o projeto disponibiliza um comando específico para gerar o executável portátil:

```bash
npm run dist:portable
```

O ícone de Windows fica em `build/icon.ico`; o PNG correspondente é usado nos pacotes Linux. Preferências de aparência são gravadas separadamente em `settings.json`, dentro do diretório de dados de usuário.

**Observação:** os comandos dependem dos scripts definidos no `package.json`. A geração de um pacote não garante, por si só, que ele funcione corretamente em todas as versões do sistema operacional. O build e os testes do Linux ainda precisam ser validados.

## 🎮 Como usar

1. Abra o RetroNexus.
2. Clique em **Adicionar jogo**.
3. Informe o nome e selecione o console de origem.
4. Escolha o executável do jogo no computador.
5. Opcionalmente, adicione uma capa, uma descrição, o diretório de trabalho e argumentos de inicialização.
6. Salve o cadastro.
7. Selecione o jogo na biblioteca e clique em **Jogar**.

No Linux, o arquivo selecionado precisa ter permissão de execução.

Se você mover ou remover o executável original, poderá ser necessário corrigir o caminho cadastrado no launcher.

## 💾 Armazenamento local

O RetroNexus mantém os registros dos jogos e as preferências do aplicativo no computador do usuário.

O banco de dados SQLite, o arquivo de preferências e o cache são armazenados conforme a estrutura de diretórios utilizada pelo Electron e pela aplicação.

No Windows, os dados ficam no diretório de dados do usuário, configurado para o RetroNexus. No Linux, a localização depende dos diretórios de dados e configuração definidos pelo ambiente e pela aplicação.

**Importante:** não apague o diretório de dados do RetroNexus se quiser preservar sua biblioteca e suas configurações. Recomenda-se manter uma cópia de segurança desses dados.

## 🔒 Segurança e comportamento

- O RetroNexus utiliza os caminhos configurados pelo usuário para iniciar os jogos.
- A remoção de um registro da biblioteca não deve apagar automaticamente o executável original.
- Os argumentos de inicialização são processados sem invocar um shell.
- Scripts e comandos obtidos de arquivos externos não são executados automaticamente pelo launcher.

## 📌 Escopo atual

O RetroNexus está focado em organizar e executar jogos que o usuário já possui.

O projeto não inclui jogos, ROMs ou ISOs. Cada jogo permanece sob os direitos e as condições de distribuição de seus respectivos responsáveis.

## 🧰 Tecnologias

- [Electron](https://www.electronjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [React](https://react.dev/)
- [Vite](https://vite.dev/)
- [SQLite](https://www.sqlite.org/)

## 🗺️ Próximos passos

O projeto poderá evoluir com melhorias na interface, suporte validado ao Linux, backup da biblioteca e recursos adicionais de organização.

Novas funcionalidades serão documentadas conforme forem implementadas e testadas.

## 🤝 Contribuições

Sugestões, relatos de problemas e contribuições são bem-vindos. Consulte as informações do repositório para conhecer as formas disponíveis de participar.

## 📄 Licença

O RetroNexus é um projeto de código aberto distribuído sob a **licença MIT**.

Você pode utilizar, copiar, modificar, mesclar, publicar, distribuir e sublicenciar o código, respeitando os termos da licença.

Consulte o arquivo [`LICENSE`](LICENSE) para ler o texto completo.

As bibliotecas e dependências de terceiros continuam sujeitas às suas respectivas licenças.

---

**RetroNexus — sua coleção retrô, organizada em um só lugar.**
