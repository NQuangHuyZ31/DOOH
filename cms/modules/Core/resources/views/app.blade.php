<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>DOOH CMS</title>
        @viteReactRefresh
        @vite(['modules/Core/resources/js/app.tsx'])
    </head>
    <body style="margin: 0; padding: 0;">
        <div id="app"></div>
    </body>
</html>
