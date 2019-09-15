<?php

namespace App\Controller\Modules\Payments;

use App\Controller\Utils\Application;
use App\Controller\Utils\Repositories;
use Doctrine\DBAL\DBALException;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class MyPaymentsOwedController extends AbstractController
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
     * @Route("/my-payments-owed", name="my-payments-owed")
     * @param Request $request
     * @return Response
     * @throws DBALException
     */
    public function display(Request $request)
    {
        $this->add($request);

        if (!$request->isXmlHttpRequest()) {
            return $this->renderTemplate(false);
        }
        return $this->renderTemplate(true);
    }

    /**
     * @param Request $request
     */
    protected function add(Request $request)
    {
        $form = $this->app->forms->moneyOwed();
        $form->handleRequest($request);

        if ($form->isSubmitted() && $form->isValid()) {
            $form_data = $form->getData();
            $em = $this->getDoctrine()->getManager();
            $em->persist($form_data);
            $em->flush();
        }

    }

    /**
     * @param bool $ajax_render
     * @return Response
     * @throws DBALException
     */
    protected function renderTemplate($ajax_render = false)
    {

        $form = $this->app->forms->moneyOwed();
        $owed_by_me = $this->app->repositories->myPaymentsOwedRepository->findBy([
            'deleted' => 0,
            'owedByMe' => 1
        ]);

        $owed_by_others = $this->app->repositories->myPaymentsOwedRepository->findBy([
            'deleted' => 0,
            'owedByMe' => 0
        ]);

        $summary_owed_by_others = $this->app->repositories->myPaymentsOwedRepository->getMoneyOwedSummaryForTargetsAndOwningSide(0);
        $summary_owed_by_me = $this->app->repositories->myPaymentsOwedRepository->getMoneyOwedSummaryForTargetsAndOwningSide(1);

        return $this->render('modules/my-payments/owed.html.twig', [
            'ajax_render' => $ajax_render,
            'form' => $form->createView(),
            'owed_by_me' => $owed_by_me,
            'owed_by_others' => $owed_by_others,
            'summary_owed_by_others' => $summary_owed_by_others,
            'summary_owed_by_me' => $summary_owed_by_me,
        ]);
    }

    /**
     * @Route("/my-payments-owed/remove/", name="my-payments-owed-remove")
     * @param Request $request
     * @return Response
     * @throws \Exception
     */
    public function remove(Request $request)
    {

        $response = $this->app->repositories->deleteById(
            Repositories::MY_PAYMENTS_OWED_REPOSITORY_NAME,
            $request->request->get('id')
        );

        if ($response->getStatusCode() == 200) {
            return $this->renderTemplate(true);
        }
        return $response;
    }

    /**
     * @Route("my-payments-owed/update/" ,name="my-payments-owed-update")
     * @param Request $request
     * @return JsonResponse
     */
    public function update(Request $request)
    {
        $parameters = $request->request->all();
        $entity = $this->app->repositories->myPaymentsOwedRepository->find($parameters['id']);
        $response = $this->app->repositories->update($parameters, $entity);

        return $response;
    }
}
