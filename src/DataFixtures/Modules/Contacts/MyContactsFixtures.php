<?php

namespace App\DataFixtures\Modules\Contacts;

use App\Controller\Utils\Utils;
use App\Entity\Modules\Contacts\MyContacts;
use App\Entity\Modules\Contacts\MyContactsGroups;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\OrderedFixtureInterface;
use Doctrine\Common\Persistence\ObjectManager;
use Faker\Factory;

class MyContactsFixtures extends Fixture implements OrderedFixtureInterface
{
    /**
     * Factory $faker
     */
    private $faker;

    public function __construct() {
        $this->faker = Factory::create('en');
    }


    public function load(ObjectManager $manager)
    {

        for($x = 0; $x <= 20; $x++) {

            $all_contact_group  = $manager->getRepository(MyContactsGroups::class)->findAll();
            $my_contact_group   = Utils::arrayGetRandom($all_contact_group);
            $my_contact_type    = Utils::arrayGetRandom(MyContactsGroups::ALL_TYPES);
            $description        = $this->faker->name . ' ' . $this->faker->lastName;

            switch($my_contact_type){
                case 'phone':
                    $contact = $this->faker->phoneNumber;
                    break;
                case 'email':
                    $contact = $this->faker->freeEmail;
                    break;
                case 'other':
                    $contact = $this->faker->ipv4;
                    break;
                case 'archived':
                    $contact = $this->faker->phoneNumber;
                    break;
                default:
                    $contact = '';
            }

            $my_contact  = new MyContacts();
            $my_contact->setGroup($my_contact_group);
            $my_contact->setDescription($description);
            $my_contact->setType($my_contact_type);
            $my_contact->setContact($contact);

            $manager->persist($my_contact);
        }

        $manager->flush();
    }

    /**
     * Get the order of this fixture
     *
     * @return integer
     */
    public function getOrder() {
        return 14;
    }

}
