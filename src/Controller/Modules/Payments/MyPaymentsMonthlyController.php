<?php

namespace App\Controller\Modules\Payments;

use App\Controller\Utils\Application;
use App\Controller\Utils\Repositories;
use App\Entity\Modules\Payments\MyPaymentsMonthly;
use App\Form\Modules\Payments\MyPaymentsMonthlyType;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Annotation\Route;

class MyPaymentsMonthlyController extends AbstractController
{
    /**
     * @var Application $app
     */
    private $app;

    public function __construct(Application $app)
    {

        $this->app = $app;
    }

    /**
     * @Route("/my-payments-monthly", name="my-payments-monthly")
     */
    public function display(Request $request)
    {
        $this->addFormDataToDB($this->getForm(), $request);

        if (!$request->isXmlHttpRequest()) {
            return $this->renderTemplate($this->getForm(), false);
        }
        return $this->renderTemplate($this->getForm(), true);
    }

    /**
     * @param $payments_form
     * @param $request
     */
    protected function addFormDataToDB($payments_form, $request)
    {
        $payments_form->handleRequest($request);

        if ($payments_form->isSubmitted($request) && $payments_form->isValid()) {
            $em = $this->getDoctrine()->getManager();
            $em->persist($payments_form->getData());
            $em->flush();
        }

    }

    private function getForm()
    {
        return $this->createForm(MyPaymentsMonthlyType::class);
    }

    protected function renderTemplate($form, $ajax_render = false)
    {
        $monthly_form_view = $form->createView();

        $columns_names = $this->getDoctrine()->getManager()->getClassMetadata(MyPaymentsMonthly::class)->getColumnNames();
        Repositories::removeHelperColumnsFromView($columns_names);

        $all_payments = $this->app->repositories->myPaymentsMonthlyRepository->findBy(['deleted' => '0'], ['date' => 'ASC']);
        $dates_groups = $this->app->repositories->myPaymentsMonthlyRepository->fetchAllDateGroups();
        $payments_by_type_and_date = $this->app->repositories->myPaymentsMonthlyRepository->getPaymentsByTypes();
        $payments_types = $this->app->repositories->myPaymentsSettingsRepository->findBy(['deleted' => '0', 'name' => 'type']);


        return $this->render('modules/my-payments/monthly.html.twig', [
            'form' => $monthly_form_view,
            'all_payments' => $all_payments,
            'columns_names' => $columns_names,
            'dates_groups' => $dates_groups,
            'ajax_render' => $ajax_render,
            'payments_by_type_and_date' => $payments_by_type_and_date,
            'payments_types' => $payments_types
        ]);
    }

    /**
     * @Route("/my-payments-monthly/remove/", name="my-payments-monthly-remove")
     * @param Request $request
     * @return \Symfony\Component\HttpFoundation\Response
     * @throws \Exception
     */
    public function remove(Request $request)
    {

        $response = $this->app->repositories->deleteById(
            Repositories::MY_PAYMENTS_MONTHLY_REPOSITORY_NAME,
            $request->request->get('id')
        );

        if ($response->getStatusCode() == 200) {
            return $this->renderTemplate($this->getForm(), true);
        }
        return $response;
    }

    /**
     * @Route("my-payments-monthly/update/" ,name="my-payments-monthly-update")
     * @param Request $request
     * @return JsonResponse
     */
    public function update(Request $request)
    {
        $parameters = $request->request->all();
        $entity = $this->app->repositories->myPaymentsMonthlyRepository->find($parameters['id']);
        $response = $this->app->repositories->update($parameters, $entity);

        return $response;
    }
}
