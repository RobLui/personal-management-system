<?php

namespace App\Controller\Utils;

use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

class Env extends AbstractController {


    public static function getUploadDir() {
        return $_ENV['UPLOAD_DIR'];
    }

    public static function getImagesUploadDir() {
        return $_ENV['IMAGES_UPLOAD_DIR'];
    }

    public static function getFilesUploadDir() {
        return $_ENV['FILES_UPLOAD_DIR'];
    }

    public static function isDemo() {
        try {
            $is_demo = (bool)$_ENV['APP_DEMO'];
        } catch (\Exception $e) {
            $is_demo = false;
        }
        return $is_demo;
    }

}
