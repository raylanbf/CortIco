# CortIco - Gerador de Ícones

Aplicação simples para fazer upload de uma imagem e gerar ícones redimensionados para Android, iOS e extensões do Chrome.

## Como usar

1. Instale dependências:
   ```bash
   npm install
   ```
2. Inicie o servidor:
   ```bash
   npm start
   ```
3. Abra `http://localhost:3000` no navegador.
4. Envie a imagem e baixe o arquivo `icon-pack.zip`.

## Tamanhos gerados

- Android: mipmap mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi
- iOS: AppIcon em vários tamanhos (@1x, @2x, @3x)
- Chrome: 16x16, 48x48, 128x128

## Observações

- A imagem deve ser PNG ou JPG.
- Use imagens quadradas para evitar cortes e distorções.
