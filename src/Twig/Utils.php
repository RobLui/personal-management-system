<?php

namespace App\Twig;

use App\Controller\Utils\Env;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class Utils extends AbstractExtension
{
    public function getFunctions()
    {
        return [
            new TwigFunction('unset', [$this, '_unset']),
            new TwigFunction('keepMenuOpen', [$this, 'keepMenuOpen']),
            new TwigFunction('isDemo', [$this, 'isDemo']),
        ];
    }

    public function _unset($array, $key)
    {
        unset($array[$key]);
        return $array;
    }

    /**
     * @param string $currUrl
     * @param string $pathUrl
     * @param string $searchedString
     * @param mixed $childrensSubmenuIds
     * @return string|void
     */
    public function keepMenuOpen(string $currUrl, string $pathUrl = '', string $searchedString = '', $childrensSubmenuIds = '')
    {
        $dropdownOpenClass = 'open';

        if (!empty($pathUrl) && $currUrl == $pathUrl) {

            return $dropdownOpenClass;
        } elseif (!empty($searchedString) && strstr($currUrl, $searchedString)) {

            return $dropdownOpenClass;
        } elseif (!empty($childrensSubmenuIds)) {

            /**
             * Info: not a perfect solution, but fine for now
             *  might cause problems if url has some numbers in name (equal to child node id)
             */
            foreach ($childrensSubmenuIds as $childSubmenuId) {

                if (strstr($currUrl, $childSubmenuId)) {
                    return $dropdownOpenClass;
                }

            }

        }
        return;
    }

    public function isDemo()
    {
        $is_demo = Env::isDemo();
        return $is_demo;
    }
}
