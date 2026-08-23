<?php

namespace App\Core\Controllers;

use App\Core\Traits\ApiResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Routing\Controller;

abstract class ApiController extends Controller
{
    use ApiResponse, AuthorizesRequests;
}
