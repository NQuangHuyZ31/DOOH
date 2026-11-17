<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>{{ config('app.name', 'DOOH CMS') }}</title>
        @if (file_exists(public_path('hot')))
            @viteReactRefresh
            @vite(['modules/Core/resources/js/app.tsx'])
        @else
            @moduleCss('all')
        @endif
    </head>
    <body style="margin: 0; padding: 0;">
        <div id="app"></div>
        @if (!file_exists(public_path('hot')))
            @moduleJs('all')
        @endif
    </body>
</html>
