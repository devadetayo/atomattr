<?php
// EXAMPLE ONLY - rename to checkout.php when you wire payments. Creates a Stripe Checkout Session (no SDK needed).
// Put your key in the server environment, never in the browser:  STRIPE_SECRET_KEY=sk_live_...  (or a restricted key with Checkout write access)
header('Content-Type: application/json'); header('Access-Control-Allow-Origin: *'); header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
$in = json_decode(file_get_contents('php://input'), true) ?: [];
$catalog = json_decode(file_get_contents(__DIR__ . '/../templates/templates.json'), true);   // price comes from the server's copy, never from the browser
$t = null; foreach ($catalog as $x) if (($x['id'] ?? '') === ($in['id'] ?? '')) $t = $x;
if (!$t || empty($t['price']) || !filter_var($in['email'] ?? '', FILTER_VALIDATE_EMAIL)) { http_response_code(400); echo '{"error":"Invalid request"}'; exit; }
$site = 'https://atomattr.com';   // your site
$f = http_build_query([
  'mode' => 'payment', 'customer_email' => $in['email'],
  'success_url' => "$site/templates.html?paid=" . $t['id'], 'cancel_url' => "$site/templates.html",
  'line_items' => [[ 'quantity' => 1, 'price_data' => [ 'currency' => strtolower($t['currency'] ?? 'usd'), 'unit_amount' => (int) round($t['price'] * 100), 'product_data' => ['name' => $t['name']] ] ]],
  'metadata' => ['template' => $t['id']],
]);
$ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $f, CURLOPT_RETURNTRANSFER => true, CURLOPT_USERPWD => getenv('STRIPE_SECRET_KEY') . ':']);
$r = json_decode(curl_exec($ch), true);
echo isset($r['url']) ? json_encode(['url' => $r['url']]) : '{"error":"Checkout failed"}';
// Next: a webhook (checkout.session.completed, verified with STRIPE_WEBHOOK_SECRET) that emails the buyer a download link.
