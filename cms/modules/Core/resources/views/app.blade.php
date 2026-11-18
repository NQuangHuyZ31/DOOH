<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <title>{{ config('app.name', 'Ureka Media DOOH CMS') }}</title>
        <link rel="icon" type="image/svg+xml" href="{{ asset('favicon.svg') }}">
        <link rel="alternate icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        @if (file_exists(public_path('hot')))
            @viteReactRefresh
            @vite(['modules/Core/resources/js/app.tsx'])
        @else
            @moduleCss('all')
        @endif
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #221F1F;">
        <div id="app"></div>
        @if (!file_exists(public_path('hot')))
            @moduleJs('all')
        @endif
    </body>
</html>
